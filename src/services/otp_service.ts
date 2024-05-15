import { Service } from '../base';
import { UserProperties } from 'src/entity/models/user';

export interface OTPService extends Service {
    isOnPenalty(user: UserProperties): boolean;
    isExpired(user: UserProperties): boolean;
    isCountdown(user: UserProperties): boolean;
    verifyOtp(user: UserProperties, otp: string): Promise<void>;
    generate(user: UserProperties): Promise<boolean>;
    verify(user: UserProperties, otp: string): Promise<boolean>;
}

export default OTPService;
