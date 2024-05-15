import { Logger as WinstonLogger } from 'winston';
import { createLogerInstance } from '../factory';

export class LoggerModule {
    private _logger: WinstonLogger;

    static instance: LoggerModule;

    static getInstance(): LoggerModule {
        if (!this.instance) {
            this.initialize();
        }
        return this.instance;
    }

    static initialize(): void {
        this.instance = new LoggerModule();
    }

    constructor() {
        this._logger = createLogerInstance();
    }

    get logger(): WinstonLogger {
        return this._logger;
    }
}

/**
 * @description
 * this class is used to retain existing logger implementation
 */
export class Logger {
    private _logger: WinstonLogger;

    public static logger = LoggerModule.getInstance().logger;

    constructor() {
        this._logger = LoggerModule.getInstance().logger;
    }

    get logger(): WinstonLogger {
        return this._logger;
    }
}


export default Logger;