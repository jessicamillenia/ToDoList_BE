export interface SignUpRequest {
    email: string;
    password: string;
    fullname: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface JwtTokenResponse {
    token: string | UserAccessToken;
    refresh_token: string;
    lifetime: number;
}

export interface UserAccessToken {
    user_id: number;
    exp: number;
    iat: number;
}
