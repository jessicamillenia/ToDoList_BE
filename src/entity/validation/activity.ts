import * as Joi from 'joi';

import { REQUIRED_STRING, OPTIONAL_NUMBER, OPTIONAL_STRING } from './common';


export const REQUIRED_ACTIVITY_ID = Joi.object().keys({
    body: Joi.object().keys({
        activity_id: REQUIRED_STRING
    }).required()
}).required();

export const GET_ACTIVITY_LIST = Joi.object().keys({
    query: Joi.object().keys({
        page: OPTIONAL_NUMBER.default(1),
        per_page: OPTIONAL_NUMBER.default(10),
        sort: OPTIONAL_STRING.default('-created_at')
    }).optional()
}).required();

export const CREATE_ACTIVITY = Joi.object().keys({
    body: Joi.object().keys({
        title: REQUIRED_STRING
    }).required()
}).required();

export const UPDATE_ACTIVITY = Joi.object().keys({
    body: Joi.object().keys({
        id: REQUIRED_STRING,
        title: REQUIRED_STRING
    }).required()
}).required();
