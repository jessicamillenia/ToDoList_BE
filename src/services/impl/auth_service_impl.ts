import * as moment from 'moment';

import { Auth, RequestData, SQLContext, Service, Context } from '../../base';
import { BadRequestError, UnauthorizedError } from '../../base/utils/http_error';

import OTPService from '../otp_service';
import AuthService from '../auth_service';
import UserRepository from 'src/repositories/user_repository';
import Helpers from 'src/utils/helpers';

import { UserProperties } from 'src/entity/models/user';
import { OTP_CONFIG, RESET_PASSWORD_AUTH } from '../../entity/constant/auth';
import { JwtTokenResponse, LoginRequest, SignUpRequest, UserAccessToken } from '../../entity/dto/auth';

export class AuthServiceImpl extends Service implements AuthService {
    private userRepo: UserRepository;
    private otpService: OTPService;

    constructor(
        source: {
            userRepo: UserRepository,
            otpService: OTPService,
        }
    ) {
        super();
        this.userRepo = source.userRepo;
        this.otpService = source.otpService;
    }

    async signup(data: SignUpRequest): Promise<void> {
        try {
            const email = data.email.toLowerCase();
            const existingUser = await this.userRepo.findOne({ email }, ['id']);
            if (existingUser) {
                throw new BadRequestError('Account with that email address already exists.', 'USER_ALREADY_EXIST');
            }

            const {
                otp,
                validUntil
            } = await Helpers.generateOTPWithExpiration(OTP_CONFIG.OTP_LIFETIME_MINUTE, email);

            await this.userRepo.create({
                fullname: data.fullname,
                email,
                password: data.password,
                otp,
                otp_valid_until: validUntil,
            });

            await this.event.publishMessage('send-email', { email, otp });
        } catch (error: any) {
            this.logger.error('error while signing up', { error });
            throw error;
        }
    }

    async signin(data: LoginRequest): Promise<void> {
        const email = data.email.toLowerCase();

        try {
            const user = await this.userRepo.findOne({ email });
            if (!user) {
                throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIAL');
            }

            const isMatch = Auth.validatePassword(data.password, String(user.password));
            if (!isMatch) {
                throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIAL');
            }

            await this.otpService.generate(user);
        } catch (error: any) {
            this.logger.error('error while signing in', { error });
            throw error;
        }
    }

    async resendOtp(email: string): Promise<void> {
        const user = await this.userRepo.findOneOrFail({ email: email.toLowerCase() });

        // only resend OTP if there is a currently valid otp, otherwise the user must relogin
        if (this.otpService.isCountdown(user)) {
            throw new UnauthorizedError('Invalid resend OTP request', 'INVALID_RESEND_OTP_REQUEST');
        }

        await this.otpService.generate(user);
    }

    async verifyOtp(data: Partial<RequestData>): Promise<JwtTokenResponse> {
        const email = data.body.email.toLowerCase();
        let user: UserProperties | null;

        try {
            const { Op } = SQLContext.getORMProvider();

            user = await this.userRepo.findOne({ email, otp: { [Op.ne]: null } as any }, [], { useMaster: true });
            if (!user) {
                throw new BadRequestError('invalid otp request', 'INVALID_OTP_REQUEST');
            }

            await this.otpService.verify(user, data.body.otp);
        } catch (error: any) {
            this.logger.error('error while verifying otp', { error });
            throw error;
        }

        const { lifetime, refresh_token, token } = await this.generateAccessAndRefreshToken(user, true, data.query.sign);

        return {
            token,
            lifetime,
            refresh_token
        };
    }

    async logout(context: Context): Promise<void> {
        await this.userRepo.findOneOrFail({ id: context.user_id });
        await this.userRepo.update({ id: context.user_id }, { refresh_token: null!, refresh_token_valid_until: null! });
    }

    async refresh(rToken: string, regenerate: boolean, sign = true): Promise<JwtTokenResponse> {
        const user = await this.userRepo.findOne({ refresh_token: rToken });
        if (!user) {
            throw new UnauthorizedError('Token mismatch.', 'TOKEN_INVALID');
        }

        if (moment()
            .isAfter(moment(user.refresh_token_valid_until))) {
            throw new UnauthorizedError('Refresh token expired', 'TOKEN_EXPIRED');
        }

        const { token, refresh_token, lifetime } = await this.generateAccessAndRefreshToken(user, regenerate, sign);

        return {
            token,
            lifetime,
            refresh_token,
        };
    }

    async signToken(token: UserAccessToken): Promise<any> {
        return Auth.generateToken({ user_id: token.user_id }, true);
    }

    async generateAccessAndRefreshToken(user: UserProperties, regenerateRefresh = true, signToken = true): Promise<JwtTokenResponse> {
        const lifetime = Number(process.env.JWT_LIFETIME || 3600);
        const expiredAt = moment().add(lifetime, 'seconds').unix();

        const { token, valid_until: validUntil } = Auth.generateRefreshToken();

        if (regenerateRefresh) {
            this.logger.info(`generating token for user with id ${user.id}`);
            await this.userRepo.update({ id: user.id }, { refresh_token: token, refresh_token_valid_until: validUntil });
        }

        const userToken = { exp: expiredAt, iat: moment().unix(), user_id: user.id as number };
        let accessToken: string | UserAccessToken = userToken;

        if (signToken) {
            const { token } = await this.signToken(userToken);
            accessToken = token;
        }

        return {
            token: accessToken,
            refresh_token: regenerateRefresh ? token : user.refresh_token,
            lifetime
        };
    }

    async forgetPassword(email: string): Promise<void> {
        try {
            const user = await this.userRepo.findOne({ email });
            if (!user) {
                this.logger.warn('[ForgetPassword] user with email %s not found', email);
                return;
            }

            const {
                token,
                validUntil
            } = await Helpers.generateRandomTokenWithExpiration(Number(process.env.RESET_PASSWORD_EXPIRY_MINUTE) || RESET_PASSWORD_AUTH.TOKEN_LIFETIME_MINUTE);

            await this.userRepo.update({ email }, {
                reset_password_token: token,
                reset_password_token_valid_until: validUntil
            });

            await this.event.publishMessage('send-email', { email, token });
        } catch (error: any) {
            this.logger.error('forget password failed', { error });
            throw error;
        }
    }

    async resetPassword(resetPasswordToken: string, password: string): Promise<void> {
        try {
            const user = await this.userRepo.findOne({ reset_password_token: resetPasswordToken });
            if (!user) {
                throw new UnauthorizedError('Reset password token mismatch', 'TOKEN_INVALID');
            }

            if (user.refresh_token_valid_until && moment().isAfter(moment(user.reset_password_token_valid_until))) {
                throw new UnauthorizedError('Reset password token expired', 'TOKEN_EXPIRED');
            }

            await this.userRepo.update({ id: user.id }, {
                reset_password_token: null!,
                reset_password_token_valid_until: null!,
                password: await Helpers.generateHashedPassword(password),
            });
        } catch (error: any) {
            this.logger.error('reset password failed', { error });
            throw error;
        }
    }
}

export default AuthServiceImpl;