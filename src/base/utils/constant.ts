import * as Sequelize from 'sequelize';
import { Context } from '../typings';

export enum COMMON_ERRORS {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    SERVER_ERROR = 'InternalServerError',
    TOKEN_INVALID = 'TOKEN_INVALID',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',
    ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
    NO_ACCESS = 'NO_ACCESS',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
}

export enum CLEARANCE {
    BLOCKED = 0,
    AUTHENTICATED = 1
}

export enum TOKEN_TYPE {
    BEARER = 'Bearer',
    BASIC = 'Basic'
}

export const MANDATORY_REQUEST_HEADER = {
    REQUEST_ID: 'x-request-id',
    USER_ID: 'x-user-id',
};

export const ENDPOINTS = {
    HEALTHCHECK: '/healthcheck',
    SWAGGER_SPEC: '/specs',
    SWAGGER_DOCS: '/api-docs'
};

export const DEFAULT = {
    REQUEST_SIZE: '1mb',
    SUBS_TEST_CONTROLLER: 'SubscribersController',
    SERVICE_NAME: 'Service',
    SERVICE_DESC: 'backend microservice',
    SERVICE_VERSION: '1.0.0',
    HEALTHCHECK_MESSAGE: 'test'
};

export const SWAGGER_DEFAULT = {
    VERSION: '3.0.0',
    REQUEST_BODY: {
        type: 'object',
        properties: {
            key: {
                type: 'string'
            }
        }
    },
    SECURITY_SCHEME: {
        JWTAuth: {
            type: 'http',
            scheme: 'bearer'
        },
        SecretAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'secret'
        },
        PropagatedAuth: {
            type: 'apiKey',
            in: 'header',
            name: MANDATORY_REQUEST_HEADER.USER_ID
        }
    }
};

export enum HttpMethod {
    POST = 'POST',
    GET = 'GET',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export enum Environment {
    STAGING = 'staging',
    PRODUCTION = 'production'
}

export const CONFIG = {
    PATH: '../../../src/config',
    ENV: 'environment.json'
};

export const Types ={
    STRING: 'string',
    NUMBER: 0,
    BOOLEAN: true,
    PAGINATION: {
        page: 0 ,
        per_page: 0 ,
        total_page: 0,
        total_data: 0,
    }
};

export enum INTERNAL_TOPICS {
    RETRY_MESSAGE = 'retry-message',
    RETRY_MESSAGE_STATUS = 'retry-message-status'
}

export const TRUTHY: { [s:string]: boolean } = {
    '1': true,
    'true': true,
    'on': true
};

export const ISOLATION_LEVELS = Sequelize.Transaction.ISOLATION_LEVELS;

export const EMPTY_CONTEXT: Context = {
    request_id: '',
    user_id: 0,
};
