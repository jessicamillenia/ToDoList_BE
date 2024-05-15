/// <reference path="../typings/express.d.ts" />

import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/http_error';
import { Context, JwtAuthClaims } from '../typings/common';
import Auth from '../libs/auth';

const JWT_EXPIRED_MESSAGE = 'jwt expired';

enum RESPONSE_CODE {
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    INVALID_USER = 'INVALID_USER'
}

const generateContext = async <Tokenable extends JwtAuthClaims>(request: Request, payload: Tokenable): Promise<Context> => {
    return {
        request_id: request.context?.request_id,
        user_id: payload.user_id,
    };
};

const verifyToken = async (token: string): Promise<any> => {
    return Auth.verifyJwtToken(token);
};

const getContextFromAuthorization = async <Tokenable extends JwtAuthClaims>(req: Request): Promise<Context> => {
    const authorizationToken: string | undefined = req.headers.authorization;
    if (!authorizationToken) {
        throw new UnauthorizedError('token not provided', RESPONSE_CODE.TOKEN_INVALID);
    }

    const [type, token] = authorizationToken.split(' ');
    if (!token || type !== 'Bearer') {
        throw new UnauthorizedError('token signature invalid', RESPONSE_CODE.TOKEN_INVALID);
    }

    let context: Context;
    try {
        const tokenPayload: Tokenable = await verifyToken(token);
        context = await generateContext<Tokenable>(req, tokenPayload);
    } catch (err: any) {
        const message =
            err.message === JWT_EXPIRED_MESSAGE
                ? ['token expired', RESPONSE_CODE.TOKEN_EXPIRED]
                : ['token invalid', RESPONSE_CODE.TOKEN_INVALID];

        throw new UnauthorizedError(message[0], message[1]);
    }

    return context;
};

export const JWTMiddleware = async <Tokenable extends JwtAuthClaims>(req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
        const context = await getContextFromAuthorization<Tokenable>(req);
        req.context = context;

        return next();
    } catch (err) {
        return next(err);
    }
};

export default JWTMiddleware;
