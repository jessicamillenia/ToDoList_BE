/// <reference path="../typings/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http_error';
import { MANDATORY_REQUEST_HEADER } from '../utils/constant';
import { ErrorResponse } from '../typings';
import { LoggerModule } from '../utils/logger';

export const GlobalExceptionHandler = (error: any, req: Request, res: Response, _next: NextFunction): Response => {
    const httpError = HttpError.createFromError(error);

    if (httpError.isServerError) {
        LoggerModule.getInstance()
            .logger.error(`${httpError.name}: ${httpError.message}`, { error, context: req.context });
    } else {
        LoggerModule.getInstance()
            .logger.warn(`${httpError.name}: ${httpError.message}`, { error, context: req.context });
    }

    const response: ErrorResponse = httpError.toErrorResponse();

    return res.status(httpError.httpStatus)
        .set(MANDATORY_REQUEST_HEADER.REQUEST_ID, req.context?.request_id || '')
        .json(response);
};

export default GlobalExceptionHandler;
