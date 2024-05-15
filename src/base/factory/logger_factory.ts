import { createLogger, transports, format, Logger as WinstonLogger, transport } from 'winston';
import { DEFAULT, Environment } from '../utils/constant';
import { isDevEnvironment, isTestEnvironment } from '../utils/helpers';

const consoleTransportFormat = format.printf((info) => {
    const { level, message } = info;
    if (level === 'error') {
        const trace = info.error_trace ? '\n' + `-> ${info.error_trace}` : '';
        return `${level}: ${message} ${trace}`;
    }
    return `${level}: ${message}`;
});

/** format to be printed on console */
const generateLogTransports = (): transport => {
    return new transports.Console({
        format: format.combine(
            format.errors({ stack: true }),
            consoleTransportFormat,
            format.colorize({ all: true })
        ),
        silent: isTestEnvironment()
    });
};

export const createLogerInstance = (): WinstonLogger => {
    return createLogger({
        defaultMeta: {
            service: process.env.SERVICE_NAME ?? DEFAULT.SERVICE_NAME,
            env: isDevEnvironment() ? Environment.STAGING : Environment.PRODUCTION
        },
        transports: generateLogTransports(),
        format: format.combine(format.splat()),
        silent: isTestEnvironment()
    });
};

export default createLogerInstance;
