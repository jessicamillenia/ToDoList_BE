import { Controller as BaseController, Context, RequestData, JWTMiddleware, RateLimiter } from '../base';
import { RequestHandler } from 'express';

import AuthService from 'src/services/auth_service';
import UserService from 'src/services/user_service';

import { API_ROUTE, MESSAGE_RESPONSE } from '../entity/constant/common';
import { FORGET_PASSWORD, RESET_PASSWORD, UPDATE_PASSWORD, UPDATE_USER } from '../entity/validation/user';

class UserController extends BaseController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) {
        super({ path: API_ROUTE.USER });
    }

    async forgetPassword(data: RequestData): Promise<any> {
        const { email } = data.body;
        await this.authService.forgetPassword(email);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async resetPassword(data: RequestData): Promise<any> {
        const { reset_password_token: resetPasswordToken, password } = data.body;
        await this.authService.resetPassword(resetPasswordToken, password);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async updatePassword(data: RequestData, context: Context): Promise<any> {
        const { new_password: newPassword } = data.body;
        await this.userService.updatePassword(newPassword, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async updateUser(data: RequestData, context: Context): Promise<any> {
        const { fullname } = data.body;
        await this.userService.updateUser(fullname, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async getUser(_data: RequestData, context: Context): Promise<any> {
        return this.userService.getUser(context.user_id);
    }

    getLoginRateLimiterMiddleware(): RequestHandler {
        return RateLimiter(5);
    }

    setRoutes(): void {
        this.addRoute('get', '/', this.getUser.bind(this), {
            middlewares: JWTMiddleware
        });
        this.addRoute('post', '/update', this.updateUser.bind(this), {
            validate: UPDATE_USER,
            middlewares: JWTMiddleware
        });
        this.addRoute('post', 'forget-password', this.forgetPassword.bind(this), {
            validate: FORGET_PASSWORD,
            middlewares: this.getLoginRateLimiterMiddleware()
        });
        this.addRoute('post', 'reset-password', this.resetPassword.bind(this), {
            validate: RESET_PASSWORD,
            middlewares: this.getLoginRateLimiterMiddleware()
        });
        this.addRoute('post', 'update-password', this.updatePassword.bind(this), {
            validate: UPDATE_PASSWORD,
            middlewares: JWTMiddleware
        });
    }
}

export default UserController;