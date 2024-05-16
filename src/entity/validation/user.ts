import * as Joi from 'joi';

import { REQUIRED_EMAIL, REQUIRED_STRING, PASSWORD } from './common';

export const FORGET_PASSWORD = Joi.object().keys({
    body: Joi.object().keys({
        email: REQUIRED_EMAIL
    }).required()
}).required();

export const RESET_PASSWORD = Joi.object().keys({
    body: Joi.object().keys({
        password: REQUIRED_STRING.regex(PASSWORD),
        reset_password_token: REQUIRED_STRING,
    }).required()
}).required();

export const UPDATE_PASSWORD = Joi.object().keys({
    body: Joi.object().keys({
        new_password: REQUIRED_STRING.regex(PASSWORD)
    }).required()
}).required();

export const UPDATE_USER = Joi.object().keys({
    body: Joi.object().keys({
        fullname: REQUIRED_STRING
    }).required()
}).required();
