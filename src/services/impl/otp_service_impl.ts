import * as moment from 'moment';

import { Service } from '../../base';
import { TooManyRequestsError, BadRequestError } from '../../base/utils/http_error';

import Helpers from '../../utils/helpers';
import OTPService from '../otp_service';
import UserRepository from 'src/repositories/user_repository';

import { UserProperties } from 'src/entity/models/user';
import { OTP_CONFIG } from '../../entity/constant/auth';

export class OTPServiceImpl extends Service implements OTPService {
    constructor(
        private userRepo: UserRepository
    ) {
        super();
    }

    isOnPenalty(user: UserProperties): boolean {
        return !Helpers.isEmpty(user.otp_penalty_until) && moment().isBefore(moment(user.otp_penalty_until));
    }

    isExpired(user: UserProperties): boolean {
        const isEmpty = Helpers.isEmpty(user.otp_valid_until);
        return isEmpty || moment().isAfter(moment(user.otp_valid_until));
    }

    isCountdown(user: UserProperties): boolean {
        /** Countdown time according to existing implementation ( 2 minutes ) */
        return !moment().isAfter(moment(user.otp_valid_until).add(OTP_CONFIG.OTP_COUNTDOWN_TIME - OTP_CONFIG.OTP_LIFETIME_MINUTE, 'minutes'));
    }

    async verifyOtp(user: UserProperties, otp: string): Promise<void> {
        if (user.otp !== otp) {
            const isExceedTryLimit = user.otp_retry_count + 1 >= OTP_CONFIG.OTP_MAX_RETRY;

            await this.userRepo.update({ id: user.id }, {
                otp_retry_count: isExceedTryLimit
                    ? 0
                    : user.otp_retry_count + 1,
                otp_penalty_until: isExceedTryLimit
                    ? moment().add(OTP_CONFIG.OTP_PENALTY_TIME_MINUTE, 'minute').utc().format()
                    : null!
            });

            throw new BadRequestError('OTP mismatch.', 'OTP_INVALID');
        }
    }

    async generate(user: UserProperties): Promise<boolean> {
        const {
            otp,
            validUntil
        } = await Helpers.generateOTPWithExpiration(OTP_CONFIG.OTP_LIFETIME_MINUTE, user.email);

        await this.userRepo.update({ id: user.id }, {
            otp,
            otp_valid_until: validUntil,
            otp_retry_count: 0,
            otp_penalty_until: null!,
        });

        await this.event.publishMessage('send-email', { email: user.email, otp });

        return true;
    }

    async verify(user: UserProperties, otp: string): Promise<boolean> {
        if (this.isOnPenalty(user)) {
            throw new TooManyRequestsError('OTP verification is still in penalty time', 'OTP_VERIFICATION_PENALTY');
        }

        if (this.isExpired(user)) {
            throw new BadRequestError('OTP expired', 'OTP_EXPIRED');
        }

        await this.verifyOtp(user, otp);

        const userUpdatePayload: Partial<UserProperties> = {
            otp: null!,
            otp_valid_until: null!,
            otp_retry_count: 0,
            otp_penalty_until: null!,
            email_verified: true
        };

        /** flush otp data */
        await this.userRepo.update({ id: user.id }, userUpdatePayload);

        return true;
    }
}

export default OTPServiceImpl;
