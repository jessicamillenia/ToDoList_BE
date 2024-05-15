import { RequestHandler } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { RequestMeta, RouteMeta, RouteOptions } from '../controller';
import generateSwaggerSpec from '../factory/swagger_factory';
import { ENDPOINTS, SWAGGER_DEFAULT } from './constant';

const buildExampleValue = (value: string) => {
    switch (value) {
    case 'number':
        return 0;
    case 'boolean':
        return false;
    // case 'date':
    //     return '1973-01-01';
    case 'object':
        return {};
    default:
        return 'string';
    }
};

const convertJoiSchemaToSwagger = (joiObject: any) => {
    if (!joiObject._ids._byKey.values().next().value) {
        return {
            type: joiObject.type === 'any' ? 'string': joiObject.type,
            example: buildExampleValue(joiObject.type)
        };
    }

    const payload: { key: string; value: any }[] = [];
    joiObject._ids._byKey.forEach((value: any, key: string) => {
        payload.push({ key, value: value.schema.type });
    });

    return payload.reduce<Record<any, any>>((acc, item) => {
        if (!acc.properties) { acc.properties = {}; }
        switch (item.value) {
        case 'object':
            acc.properties[item.key] = convertJoiSchemaToSwagger(joiObject._ids._byKey.get(item.key).schema);
            acc.properties[item.key].type = 'object';
            break;
        case 'array':
            acc.properties[item.key] = {
                type: 'array',
                items: { type: 'object', ...convertJoiSchemaToSwagger(joiObject._ids._byKey.get(item.key).schema['$_terms'].items[0]) }
            };
            break;
        case 'date':
            acc.properties[item.key] = {
                type: 'string',
                example: buildExampleValue(item.value)
            };
            break;
        default:
            acc.properties[item.key] = {
                type: item.value,
                example: buildExampleValue(item.value)
            };
            break;
        }
        return acc;
    }, {});
};

const convertSwaggerEntityToParameter = (object: any, type: 'query' | 'path' | 'header'): any => {
    if (!object?.properties) {
        return [];
    }
    return Object.keys(object.properties).map(key => {
        const item = object.properties[key];
        return { name: key, in: type, required: false, schema: item };
    });
};

const convertSwaggerEntityToMultipart = (body: any, files: any[]): any => {
    if (!files) {
        return null;
    }
    return {
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary'
                    }
                },
                ...(body?.properties || {})
            }
        }
    };
};

const convertSwaggerEntityToBody = (body: any, files: any): any => {
    if (files) {
        return null;
    }
    return body || SWAGGER_DEFAULT.REQUEST_BODY;
};

const convertResponseStructureToSwagger = (data: any) => {
    return Object.entries(data).reduce((acc: any, [key, value]) => {
        if (!acc.properties) { acc.properties = {}; }
        const type = String(typeof value);
        if (type === 'object') {
            if (Array.isArray(value)) {
                const itemType = typeof data[key][0];
                if (itemType === 'object') {
                    acc.properties[key] = {
                        type: 'array',
                        items: { type: 'object', ...convertResponseStructureToSwagger(data[key][0]) }
                    };
                } else {
                    acc.properties[key] = { type: 'array', items: { type: itemType } };
                }
            } else {
                acc.properties[key] = convertResponseStructureToSwagger(data[key]);
                acc.properties[key].type = 'object';
            }
        } else {
            acc.properties[key] = {
                type: type,
            };
        }
        return acc;
    }, {});
};

export const GenerateRequestMeta = (options?: RouteOptions): RequestMeta => {
    const defaultMeta: RequestMeta = {
        body: SWAGGER_DEFAULT.REQUEST_BODY,
        query: [],
        headers: [],
        files: {},
    };

    if (!options) {
        return defaultMeta;
    }

    if (options.response) {
        defaultMeta.response = convertResponseStructureToSwagger(options.response);
    }

    if (options.isPublic) {
        defaultMeta.isPublic = options.isPublic;
    }

    if (options.validate) {
        try {
            const { properties: metadata } = convertJoiSchemaToSwagger(options.validate);
            defaultMeta.query = convertSwaggerEntityToParameter(metadata.query, 'query');
            defaultMeta.headers = convertSwaggerEntityToParameter(metadata.headers, 'header');
            defaultMeta.body = convertSwaggerEntityToBody(metadata.body, metadata.files);
            defaultMeta.files = convertSwaggerEntityToMultipart(metadata.body, metadata.files);
        } catch (error) {
            // --
        }
    }

    return defaultMeta;
};

export const SwaggerApiSpecEndpoint = (routesMeta: RouteMeta[]): RequestHandler => {
    return (req, res) =>
        res.json(generateSwaggerSpec(process.env.BASE_URL ?? `${req.protocol}://${req.headers.host}`, routesMeta));
};

export const SwaggerEndpoint = (): RequestHandler[] => {
    const url = (process.env.BASE_URL ?? '') + ENDPOINTS.SWAGGER_SPEC;
    return [
        ...swaggerUi.serve,
        swaggerUi.setup({}, { swaggerOptions:{ url , docExpansion: 'none', validatorUrl: null } })
    ];
};

export default {
    GenerateRequestMeta
};
