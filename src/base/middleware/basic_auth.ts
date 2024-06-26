import { NextFunction, Request, Response } from 'express';
import { COMMON_ERRORS, TOKEN_TYPE } from '../utils/constant';
import { UnauthorizedError } from '../utils/http_error';
import { decodeBase64 } from '../utils/helpers';

export const BasicAuth = (basicUsername: string, basicPassword: string) => (req: Request, res: Response, next: NextFunction): void => {
    const [tokenType, credentials] = req.headers.authorization?.split(' ') ?? [null, null];

    /** check token type */
    if (tokenType && tokenType.toLowerCase() !== TOKEN_TYPE.BASIC.toLowerCase()) {
        return next(new UnauthorizedError('token type invalid', COMMON_ERRORS.TOKEN_INVALID));
    }

    /** check credentials */
    const decodedCredentials = decodeBase64(credentials);
    const [username, password] = decodedCredentials.split(':').length === 2 ? decodedCredentials.split(':') : [null, null];
    if (username !== basicUsername || password !== basicPassword) {
        return next(new UnauthorizedError('invalid credentials', COMMON_ERRORS.INVALID_CREDENTIALS));
    }

    return next();
};

export default BasicAuth;
