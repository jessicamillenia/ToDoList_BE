import * as http from 'http';
import { HealthCheck, TerminusOptions, createTerminus } from '@godaddy/terminus';
import Logger from './logger';
import { EventBus } from '../event';
import DBModule from '../database/sql';
import RedisModule from '../database/redis';

const healthCheck: HealthCheck = async ({ state }) => {
    /**
     * - Kafka connection
     * - Database connection
     * - Redis connection
     */
    return Promise.resolve({ state });
};

const onSignal = async () =>{
    Logger.logger.info('server is starting cleanup...');
    await Promise.all([EventBus.shutdown()]);
    await DBModule.shutdown();
    RedisModule.shutdown();
};

const onShutdown = async () => {
    Logger.logger.info('cleanup finished, server is shutting down...');
};

const beforeShutdown = ()  => {
    /** to prevent race condition of kubernetes readiness */
    const waitSeconds = 10000;
    Logger.logger.info(`waiting ${waitSeconds} ms before cleanup...`);
    return new Promise(resolve => {
        setTimeout(resolve, waitSeconds); // must be same value as readiness probe
    });
};

export const TERMINUS_OPTIONS: TerminusOptions = {
    healthChecks: {
        '/healthcheck': healthCheck,
        verbatim: true,
    },
    onShutdown,
    beforeShutdown,
    onSignal,
    logger: Logger.logger.warn,
    timeout: process.env.SHUTDOWN_TIMEOUT ? Number(process.env.SHUTDOWN_TIMEOUT) : 10000,
    useExit0: true
};

export const initializeGracefulShutdown = (server: http.Server): void => {
    createTerminus(server, TERMINUS_OPTIONS);
};

export default initializeGracefulShutdown;
