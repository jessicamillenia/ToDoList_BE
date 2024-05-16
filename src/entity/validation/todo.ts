import * as Joi from 'joi';

import { REQUIRED_STRING, OPTIONAL_NUMBER, OPTIONAL_STRING, OPTIONAL_BOOLEAN } from './common';
import { TODO_PRIORITY } from '../constant/todo';


export const REQUIRED_TODO_ID = Joi.object().keys({
    body: Joi.object().keys({
        todo_id: REQUIRED_STRING
    }).required()
}).required();

export const GET_TODO_LIST = Joi.object().keys({
    query: Joi.object().keys({
        page: OPTIONAL_NUMBER.default(1),
        per_page: OPTIONAL_NUMBER.default(10),
        sort: OPTIONAL_STRING.default('-created_at')
    }).optional(),
    body: Joi.object().keys({
        activity_id: REQUIRED_STRING
    }).required()
}).required();

export const CREATE_TODO = Joi.object().keys({
    body: Joi.object().keys({
        title: REQUIRED_STRING,
        priority: REQUIRED_STRING.valid(...Object.values(TODO_PRIORITY)),
        is_active: OPTIONAL_BOOLEAN.default(true)
    }).required()
}).required();

export const UPDATE_TODO = Joi.object().keys({
    body: Joi.object().keys({
        id: REQUIRED_STRING,
        title: OPTIONAL_STRING,
        priority: OPTIONAL_STRING.valid(...Object.values(TODO_PRIORITY)),
        is_active: OPTIONAL_BOOLEAN
    }).required()
}).required();
