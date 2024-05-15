import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/http_error';
import { COMMON_ERRORS } from '../utils/constant';

export const StaticAuth = ({ headerName, headerValue }: { headerName?: string; headerValue: string; }) => (req: Request, _res: Response, next: NextFunction): void => {
    const header = (headerName ?? 'secret').toLowerCase();
    const value = headerValue;
    if (req.query[header] === value || req.headers[header] === value) {
        return next();
    }
    return next(new UnauthorizedError('token invalid', COMMON_ERRORS.TOKEN_INVALID));
};

export default StaticAuth;
