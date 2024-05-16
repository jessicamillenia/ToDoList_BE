import * as Joi from 'joi';

import { OPTIONAL_BOOLEAN, REQUIRED_EMAIL, REQUIRED_STRING, PASSWORD } from './common';

export const SIGNUP = Joi.object().keys({
    body: Joi.object().keys({
        fullname: REQUIRED_STRING.min(4).max(50),
        email: REQUIRED_EMAIL,
        password: REQUIRED_STRING.regex(PASSWORD)
    }).required()
}).required();

export const LOGIN = Joi.object().keys({
    body: Joi.object().keys({
        email: REQUIRED_EMAIL,
        password: REQUIRED_STRING.regex(PASSWORD)
    }).required()
}).required();

export const REFRESH = Joi.object().keys({
    body: Joi.object().keys({
        refresh_token: REQUIRED_STRING,
        regenerate: OPTIONAL_BOOLEAN.default(false)
    }).required(),
    query: Joi.object().keys({
        sign: OPTIONAL_BOOLEAN,
    }).required()
}).required();

export const RESEND_OTP = Joi.object().keys({
    body: Joi.object().keys({
        email: REQUIRED_EMAIL,
    }).required()
}).required();

export const VERIFY_OTP = Joi.object().keys({
    body: Joi.object().keys({
        email: REQUIRED_EMAIL,
        otp: REQUIRED_STRING
    }).required()
}).required();
