import 'source-map-support/register';

import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import helmet from 'helmet';
import * as morgan from 'morgan';
import * as path from 'path';
import * as http from 'http';
import { setImmediate } from 'async';

import Controller, { RouteMeta, StaticBaseController } from '../controller/controller';
import { EventBus, EventSubscriber, StaticEventSubscriber, SubscriberMeta, SubscriberType } from '../event';
import SubscriberRouteFactory from '../factory/subscriber_route_factory';
import GlobalExceptionHandler from '../middleware/exception';
import RouteNotFoundExceptionHandler from '../middleware/not_found';
import { CONFIG, DEFAULT, ENDPOINTS } from '../utils/constant';
import { isDevEnvironment, isTestEnvironment } from '../utils/helpers';
import Logger, { LoggerModule } from '../utils/logger';
import { generateSubscriberMeta, generateSubscriberRouteMeta } from '../utils/mapper';
import { SwaggerApiSpecEndpoint, SwaggerEndpoint } from '../utils/swagger';
import initializeGracefulShutdown from '../utils/graceful_shutdown';

export type StaticBaseApp = new (...params: any[]) => App;

enum ServerMode {
    DEFAULT = 'all',
    WEBSERVER = 'webserver',
    WORKER = 'worker'
}

export interface ServerConfig {
    port?: number;
    requestSizeLimit?: string;
    serverMode?: string;
}

export abstract class App extends Logger {
    protected _app: express.Application;

    protected _port: number;

    protected _is_init = false;
    protected _limit: string;
    protected _serverMode: ServerMode;

    private _routes_meta: RouteMeta[] = [];
    private _subscribers_meta: SubscriberMeta[] = [];

    private _on_test_controller?: StaticBaseController;

    public constructor({ port = 8080, requestSizeLimit: limit = DEFAULT.REQUEST_SIZE, serverMode }: ServerConfig = {}) {
        super();
        this._app = express();
        this._port = port;
        this._limit = limit;
        this._serverMode = this.getMode(serverMode);
    }

    private getMode(mode?: string): ServerMode {
        switch (mode) {
        case ServerMode.WEBSERVER as string:
            return ServerMode.WEBSERVER;
        case ServerMode.WORKER as string:
            return ServerMode.WORKER;
        default:
            return ServerMode.DEFAULT;
        }
    }

    public async initialize(): Promise<void> {
        try {
            LoggerModule.initialize();
            if (!this.is_test) {
                await this.checkEnvironmentVariables();
                await this.initProviders();
            }
            await this.initPlugins();
            await this.initControllers();
            await this.initExceptionHandlers();
            this._is_init = true;
        } catch (error) {
            this.logger.error('fail initializing server on port %d', this.port, { error });
            process.exit(1);
        }
    }

    /** @description for testing purpose only */
    public async initializeTest(controller?: StaticBaseController): Promise<void> {
        this._on_test_controller = controller;
        await this.initPlugins();
        await this.initControllers();
        await this.initExceptionHandlers();
    }

    /** @Overrided */
    protected async initProviders(): Promise<void> {
        /** */
    }

    /** @Overrided */
    protected async extendsPlugins(): Promise<void> {
        /** */
    }

    /** @Overrided */
    protected async initControllers(): Promise<void> {
        /** */
    }

    public get app(): express.Application {
        return this._app;
    }

    public get port(): number {
        return this._port;
    }

    private get on_test_controller(): StaticBaseController | undefined {
        return this._on_test_controller;
    }

    public addController(controller: StaticBaseController | Controller): void {
        if (!this.isWebServer) return;

        const ctrl: Controller = controller instanceof Controller ? controller : new controller();

        // skip adding controller if in test environment and controller is not the one specified
        if (this.is_test && this.on_test_controller && !(ctrl instanceof this.on_test_controller)) {
            return;
        }

        this.app.use('/', ctrl.routes);
        this._routes_meta.push(...ctrl.routes_meta.map(item => ({ ...item, controller: ctrl.constructor.name })));
    }

    private addSubscriberAsRoute(subscriber: EventSubscriber) {
        const handler = SubscriberRouteFactory(subscriber);
        this.app.post(subscriber.path, handler);
        this._routes_meta.push(generateSubscriberRouteMeta(subscriber));
    }

    public addSubscriber(subs: EventSubscriber | StaticEventSubscriber): void {
        if (this.is_test || !this.isWorker) return;
        const subscriber: EventSubscriber = subs instanceof EventSubscriber ? subs : new subs();

        if (!EventBus.is_initialized) {
            this.logger.warn(`event bus must be enabled to register ${subscriber.constructor.name}...`);
            return;
        }

        const isPull = subscriber.type === SubscriberType.PULL;
        if (isPull) {
            setImmediate(async () => {
                await EventBus.addSubscriber(subscriber);
            });
        }
        if (!isPull || isDevEnvironment()) {
            this.addSubscriberAsRoute(subscriber);
        }

        this._subscribers_meta.push(generateSubscriberMeta(subscriber));
    }

    private async initPlugins(): Promise<void> {
        this.app.use(express.json({ limit: this._limit }));
        this.app.use(express.urlencoded({ extended: true, limit: this._limit }));
        this.app.use(helmet({
            crossOriginOpenerPolicy: { policy: process.env.COOP_ORIGIN as any || 'unsafe-none' },
            crossOriginResourcePolicy: { policy: process.env.CORP_ORIGIN as any || 'cross-origin' }
        }));
        this.app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',').map(crs => crs.trim()) ?? '*' }));
        this.app.use(compression());

        if (!this.is_test) {
            this.app.use(morgan('common'));
        }

        if (!this.is_test && process.env.SWAGGER) {
            this.app.get(ENDPOINTS.SWAGGER_SPEC, SwaggerApiSpecEndpoint(this._routes_meta));
            this.app.use(ENDPOINTS.SWAGGER_DOCS, SwaggerEndpoint());
        }

        if (!this.is_test)
            await this.extendsPlugins();
    }

    private async initExceptionHandlers(): Promise<void> {
        this.app.use(RouteNotFoundExceptionHandler);
        this.app.use(GlobalExceptionHandler);
    }

    private async checkEnvironmentVariables() {
        let envs: string[];
        try {
            envs = await import(path.join(__dirname, `${CONFIG.PATH}/${CONFIG.ENV}`)) as string[];
        } catch (error) {
            this.logger.warn('environment config not found, skipping check ...');
            envs = [];
        }
        const unsetVars = envs.filter(env => process.env[env] === undefined);
        if (unsetVars.length) {
            this.logger.error('this variable(s) need to be set: \n-> ' + unsetVars.join('\n-> '));
            throw new Error('missing required environment variable(s)');
        }
    }

    private get isWebServer(): boolean {
        return [ServerMode.DEFAULT, ServerMode.WEBSERVER].includes(this._serverMode);
    }

    private get isWorker(): boolean {
        return [ServerMode.DEFAULT, ServerMode.WORKER].includes(this._serverMode);
    }

    private get is_test(): boolean {
        return isTestEnvironment();
    }

    public getInstance(): Express.Application {
        return this._app;
    }

    public start(): this {
        if (!this._is_init) {
            this.logger.warn('app is not initialized');
            process.exit(1);
        }

        this.logger.info(`starting app with ${this._serverMode} mode...`);

        const server = http.createServer(this.app);
        initializeGracefulShutdown(server);

        server.listen(this.port, () => {
            this.logger.info(`server started on port ${this.port}, serving ${this._routes_meta.length} endpoint(s)`);
        });

        if (this.isWorker) {
            this.logger.info(`worker started, serving ${this._subscribers_meta.length} subscriber(s)`);
        }

        return this;
    }
}

export default App;
