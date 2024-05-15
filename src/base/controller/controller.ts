import { RequestHandler, Router } from 'express';
import * as Joi from 'joi';
import HandlerFactory from '../factory/handler_factory';
import request_validator from '../middleware/request_validator';
import { HandlerMethod, ResponseData } from '../typings/common';
import Logger from '../utils/logger';
import { GenerateRequestMeta } from '../utils/swagger';

type AllowedMethod = 'get' | 'post' | 'put' | 'delete';
type MiddleWare = RequestHandler | RequestHandler[];

export type StaticBaseController = new (...params: any[]) => Controller;

interface ControllerOptions {
    path: string;
    middleware?: MiddleWare;
    version?: number;
}

export interface RouteOptions {
    middlewares?: MiddleWare;
    validate?: Joi.ObjectSchema;
    version?: number;
    withoutVersion?: boolean;
    response?: Record<string, any>;
    isPublic?: boolean;
}

export interface RequestMeta {
    body?: Record<string, any>;
    query?: Record<string, any>[];
    headers?: Record<string, any>[];
    files?: Record<string, any>;
    response?: Record<string, any>;
    isPublic?: boolean;
}

export interface RouteMeta {
    httpMethod: string;
    path: string;
    methodName: string;
    controller?: string;
    requestMeta?: RequestMeta;
}

export abstract class Controller extends Logger {
    private _routes: Router;
    private _middlewares: RequestHandler[] = [];
    private _path: string;
    private _version: number;

    private _routes_meta: RouteMeta[];

    public constructor({ path, middleware, version }: ControllerOptions) {
        super();
        this._path = path;
        this._version = version ?? 1;
        this._routes_meta = [];
        if (middleware) {
            this.setMiddleware(middleware);
        }
        this._routes = Router({ mergeParams: true });
        this.setRoutes();
    }

    protected setMiddleware(middleware: MiddleWare): void {
        if (middleware instanceof Array) {
            this._middlewares = middleware;
        } else {
            this._middlewares.push(middleware);
        }
    }

    protected addRoute<DataOutput extends ResponseData = any>(httpMethod: AllowedMethod, path: string, handler: HandlerMethod<DataOutput>, options?: RouteOptions): void {
        let middlewares: MiddleWare = [];

        if (options?.middlewares) {
            middlewares = options.middlewares instanceof Array ? options.middlewares : [options.middlewares];
        }

        if (options?.validate) {
            middlewares.push(request_validator(options.validate));
        }

        const pathName = this.getVersionedPath(path, options);

        if (options?.response) {
            const responseStructure = options?.response;
            if (typeof responseStructure !== 'object' || Array.isArray(responseStructure)) {
                throw new Error(`${pathName} response structure should be an object`);
            }
        }

        const routeMiddleware: RequestHandler[] = middlewares instanceof Array ? middlewares : [middlewares];
        const combinedMiddlewared = [...this._middlewares, ...routeMiddleware];

        this.routes[httpMethod](pathName, combinedMiddlewared, HandlerFactory(handler));

        this._routes_meta.push({
            httpMethod: httpMethod.toUpperCase(),
            path: pathName,
            methodName: handler.name.split(' ')[1],
            requestMeta: GenerateRequestMeta(options)
        });
    }

    protected abstract setRoutes(): void;

    public get routes(): Router {
        return this._routes;
    }

    public get path(): string {
        return this._path;
    }

    public get routes_meta(): RouteMeta[] {
        return this._routes_meta;
    }

    private getVersionedPath(childPath: string, routeOpts?: RouteOptions): string {
        if (routeOpts?.withoutVersion) {
            return `${this._path}${childPath}`;
        }
        return `/v${routeOpts?.version ?? this._version}${this._path}${childPath}`;
    }
}

export default Controller;
