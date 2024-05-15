import { StatusCodes } from 'http-status-codes';
import { RouteMeta } from '../controller';
import { DEFAULT, ENDPOINTS, SWAGGER_DEFAULT } from '../utils/constant';
import { titleCase } from '../utils/helpers';

const generatePathMetadata = (path: string) => {
    const trimmed = path.replace(/\/+$/, '');
    const splited = trimmed.split('/').slice(1);

    const reduced = splited.reduce<{path: string[], parameters: any[]}>((acc, item) => {
        const isParams = item.includes(':');
        let element = item;

        if (isParams) {
            element = item.replace(':', '');
            acc.parameters.push({ name: element, in: 'path', required: true, schema: { type: 'string' } });
            acc.path.push(`{${element}}`);
        } else {
            acc.path.push(element);
        }

        return acc;
    }, { path: [], parameters: [] });

    return {
        parameters: reduced.parameters,
        path: `/${reduced.path.join('/')}`
    };
};

const generateTagItem = (controller: string): string => {
    const separated = controller
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, function(str){ return str.toUpperCase(); })
        .trim();

    const splited = separated.split(' ');
    const lastIsController = splited[splited.length - 1].toLowerCase() === 'controller';
    if (lastIsController) {
        splited.pop();
    }

    return splited.join(' ');
};

const generateTag = (routes: RouteMeta[]): ({ name: string; description: string }[]) => {
    const reduced = routes.reduce((acc: Record<string, string>, item) => {
        if (item.controller && !acc[item.controller]) {
            acc[item.controller] = generateTagItem(item.controller);
        }
        return acc;
    }, {});

    return Object.keys(reduced).map(key => ({
        name: reduced[key],
        description: key
    }));
};


const mapAuthenticationToSecurity = (auth: string) => {
    switch (auth) {
    case 'jwt':
        return { JWTAuth: [] };
    case 'static':
        return { SecretAuth: [] };
    case 'propagated':
        return { PropagatedAuth: [] };
    default:
        return { JWTAuth: [], SecretAuth: [], PropagatedAuth: [] };
    }
};

const generateSecurity = (authentication = ['jwt', 'static', 'propagated']) => {
    return authentication.map(mapAuthenticationToSecurity);
};

const generateResponses = (responseStructure?: Record<string, any>) => {
    return {
        [StatusCodes.OK]: {
            description: 'OK',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties:{
                            message: {
                                type: 'string'
                            },
                            data: {
                                type: 'object',
                                properties: responseStructure?.properties
                            }
                        }
                    }
                }
            }
        }
    };
};

const getBody = (body?: Record<string, any>, files?: Record<string, any>) => {
    const requestBody: any = {
        description: 'Request Body',
        required: false,
        content: {}
    };

    if (files) {
        requestBody.content['multipart/form-data'] = files;
    } else {
        requestBody.content['application/json'] = {
            schema: body ?? SWAGGER_DEFAULT.REQUEST_BODY
        };
    }

    return requestBody;
};

const generatePath = (paths: RouteMeta[]) => {
    return paths.reduce<any>((acc, item) => {
        const routePath = item.path.replace(/\/+$/, '');
        const httpMethod = item.httpMethod.toLocaleLowerCase();
        const { path, parameters } = generatePathMetadata(routePath);

        if (!(path in acc)) {
            acc[path] = {};
        }

        acc[path][httpMethod] = {
            summary: item.methodName,
            operationId: item.methodName,
            tags: [generateTagItem(item.controller as string)],
            parameters: [...parameters, ...(item.requestMeta?.query ?? []), ...(item.requestMeta?.headers ?? [])],
            security: generateSecurity(),
            responses: generateResponses(item.requestMeta?.response)
        };

        if (httpMethod !== 'get') {
            acc[path][httpMethod]['requestBody'] = getBody(item.requestMeta?.body, item.requestMeta?.files);
        }

        return acc;
    }, {});
};

const generateDefaultPaths = () => {
    return {
        [ENDPOINTS.HEALTHCHECK]: {
            get: {
                summary: 'check whether server is up',
                operationId: 'healthcheck',
                tags: ['Default'],
                responses: generateResponses()
            }
        }
    };
};

const generateName = (serviceName: string | undefined) => {
    return serviceName ? serviceName.split('-').map(titleCase).join(' ') : DEFAULT.SERVICE_NAME;
};

export const generateSwaggerSpec = (host: string, routes: RouteMeta[]): any => {
    const serviceName = generateName(process.env.SERVICE_NAME ?? process.env.npm_package_name);
    return {
        openapi: SWAGGER_DEFAULT.VERSION,
        info: {
            title: serviceName,
            version: process.env.npm_package_version ?? DEFAULT.SERVICE_VERSION,
            description: process.env.npm_package_description ?? DEFAULT.SERVICE_DESC
        },
        servers: [{ 'url': host }],
        tags: generateTag(routes),
        paths: { ...generatePath(routes), ...generateDefaultPaths() },
        components: {
            securitySchemes: SWAGGER_DEFAULT.SECURITY_SCHEME
        }
    };
};

export default generateSwaggerSpec;
