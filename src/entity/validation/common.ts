import * as Joi from 'joi';

export const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?=.{8,})/;
export const REQUIRED_STRING = Joi.string().required();
export const REQUIRED_EMAIL = Joi.string().email().required();
export const OPTIONAL_BOOLEAN = Joi.boolean().optional();
export const OPTIONAL_NUMBER = Joi.number().optional();
export const OPTIONAL_STRING = Joi.string().optional();
