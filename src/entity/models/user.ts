import { BaseProps } from '../../base';

export interface UserProperties extends BaseProps {
    id: number;
    fullname: string;
    email: string;
    email_verified: boolean;
    password: string;
    refresh_token: string;
    refresh_token_valid_until: string;
    reset_password_token: string;
    reset_password_token_valid_until: string;
    otp: string;
    otp_valid_until: string;
    otp_retry_count: number;
    otp_penalty_until: string;
}
