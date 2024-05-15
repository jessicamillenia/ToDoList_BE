import { StatusCodes as StatusCode, StatusCodes } from 'http-status-codes';
import { ErrorResponse, IObject } from '../typings';
import { COMMON_ERRORS } from './constant';

interface ICustomError {
    message: string;
    name: string;
    http_status: number;
    code?: string;
    data?: IObject;
}

export class HttpError extends Error {
    public message: string;
    public httpStatus: number;
    public name: string;
    public code: string;
    public data: any;

    public static createFromError(error: any): HttpError {
        if (error instanceof HttpError) {
            return error;
        }
        const httpStatus = error.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
        return new HttpError({
            name: error.name ?? COMMON_ERRORS.SERVER_ERROR,
            message: error.message,
            http_status: httpStatus,
            code: error.code ?? String(httpStatus),
            data: error.data ?? undefined
        });
    }

    constructor({ message, name, http_status, data, code }: ICustomError) {
        super(message);
        this.message = message;
        this.httpStatus = http_status;
        this.name = name;
        this.code = code ?? String(http_status);
        this.data = data ?? undefined;
    }

    public toErrorResponse(): ErrorResponse {
        return {
            error_name: this.name,
            error_code: this.code,
            error_message: this.message,
            error_data: this.data,
        };
    }

    public get isServerError(): boolean {
        return String(this.httpStatus).startsWith('5');
    }
}

export class BusinessLogicError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'BusinessLogicError', http_status: StatusCode.BAD_REQUEST, message, code, data });
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'BadRequestError', http_status: StatusCode.BAD_REQUEST, message, code, data });
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'UnauthorizedError', http_status: StatusCode.UNAUTHORIZED, message, code, data });
    }
}

export class ForbiddenError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'ForbiddenError', http_status: StatusCode.FORBIDDEN, message, code, data });
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'NotFoundError', http_status: StatusCode.NOT_FOUND, message, code, data });
    }
}

export class UnprocessableEntityError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'UnprocessableEntityError', http_status: StatusCode.UNPROCESSABLE_ENTITY, message, code, data });
    }
}

export class TooManyRequestsError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'TooManyRequestsError', http_status: StatusCode.TOO_MANY_REQUESTS, message, code, data });
    }
}

export class InternalServerError extends HttpError {
    constructor(message: string, code?: string, data?: IObject) {
        super({ name: 'InternalServerError', http_status: StatusCode.INTERNAL_SERVER_ERROR, message, code, data });
    }
}


export default {
    HttpError,
    BusinessLogicError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    UnprocessableEntityError,
    TooManyRequestsError,
    InternalServerError
};
