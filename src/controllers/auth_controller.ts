import { RequestHandler } from 'express';
import { Controller as BaseController, RateLimiter, Context, RequestData, JWTMiddleware } from '../base';

import AuthService from 'src/services/auth_service';

import { SIGNUP, LOGIN, REFRESH, RESEND_OTP, VERIFY_OTP } from '../entity/validation/auth';
import { MESSAGE_RESPONSE, API_ROUTE } from 'src/entity/constant/common';

class AuthController extends BaseController {
    constructor(private authService: AuthService) {
        super({ path: API_ROUTE.AUTH });
    }

    async signup(data: RequestData): Promise<any> {
        await this.authService.signup(data.body);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async signin(data: RequestData): Promise<any> {
        await this.authService.signin(data.body);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async resendOtp(data: RequestData): Promise<any> {
        await this.authService.resendOtp(data.body.email);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async verifyOtp(data: RequestData): Promise<any> {
        return this.authService.verifyOtp(data);
    }

    async refresh(data: RequestData, _context: Context): Promise<any> {
        const { refresh_token: refreshToken, regenerate } = data.body;
        return this.authService.refresh(refreshToken, regenerate, data.query.sign);
    }

    async logout(_data: RequestData, context: Context): Promise<any> {
        await this.authService.logout(context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    getLoginRateLimiterMiddleware(): RequestHandler {
        return RateLimiter(5);
    }

    getOTPRateLimiterMiddleware(): RequestHandler {
        return RateLimiter(20);
    }

    protected setRoutes(): void {
        this.addRoute('post', '/signup', this.signup.bind(this), {
            validate: SIGNUP,
            middlewares: this.getLoginRateLimiterMiddleware()
        });
        this.addRoute('post', '/login', this.signin.bind(this), {
            validate: LOGIN,
            middlewares: this.getLoginRateLimiterMiddleware()
        });
        this.addRoute('post', '/otp/resend', this.resendOtp.bind(this), {
            validate: RESEND_OTP,
            middlewares: this.getOTPRateLimiterMiddleware()
        });
        this.addRoute('post', '/otp/token', this.verifyOtp.bind(this), {
            validate: VERIFY_OTP, middlewares: this.getOTPRateLimiterMiddleware()
        });
        this.addRoute('post', '/logout', this.logout.bind(this), {
            middlewares: JWTMiddleware
        });
        this.addRoute('post', '/refresh', this.refresh.bind(this), {
            validate: REFRESH,
            middlewares: this.getLoginRateLimiterMiddleware()
        });
    }
}

export default AuthController;