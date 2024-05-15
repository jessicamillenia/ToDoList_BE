import { Context, RequestData, Service } from '../base';
import { UserProperties } from 'src/entity/models/user';
import { JwtTokenResponse, LoginRequest, SignUpRequest, UserAccessToken } from '../entity/dto/auth';

export interface AuthService extends Service {
    signup(data: SignUpRequest): Promise<void>;
    signin(data: LoginRequest): Promise<void>;
    resendOtp(email: string): Promise<void>;
    verifyOtp(data: Partial<RequestData>): Promise<JwtTokenResponse>;
    logout(context: Context): Promise<void>;
    refresh(rToken: string, regenerate: boolean, sign?: boolean): Promise<JwtTokenResponse>;
    signToken(token: UserAccessToken): Promise<any>;
    generateAccessAndRefreshToken(user: UserProperties, regenerateRefresh?: boolean, signToken?: boolean): Promise<JwtTokenResponse>;
    forgetPassword(email: string): Promise<void>;
    resetPassword(resetPasswordToken: string, password: string): Promise<void>;
}

export default AuthService;
