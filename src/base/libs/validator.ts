import { IObject } from '../typings/common';
import * as Joi from 'joi';
import { UnprocessableEntityError } from '../utils/http_error';

const defaultOptions: IObject = {
    stripUnknown: {
        arrays: false,
        objects: true
    },
    abortEarly: false
};

export const SchemeValidator = (input: IObject, scheme: Joi.ObjectSchema, options = defaultOptions): any => {
    return scheme.validateAsync(input, options)
        .catch((err: any): void => {
            const details = err.details.reduce((detail: any, item: any): IObject => {
                detail[item.context.key] = item.message.replace(/"/g, '');
                return detail;
            }, {});
            throw new UnprocessableEntityError('error validating fields', 'VALIDATION_ERROR', details);
        });
};

export default SchemeValidator;
