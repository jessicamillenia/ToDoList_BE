import Redis from 'ioredis';
import Logger from '../utils/logger';

interface IRedisOpts {
    connection_string?: string;
}

export type RedisInstance = Redis;

export class RedisModule extends Logger {
    private static instance: RedisInstance;

    public static get is_initialized(): boolean {
        return !!this.instance;
    }

    public static initialize({ connection_string }: IRedisOpts = {}): void {
        const connectionString = connection_string ?? process.env.REDIS_CONNECTION_STRING;

        if (!connectionString) {
            throw new Error('connection string is not found for redis');
        }

        if (!this.instance) {
            this.instance = new Redis(connectionString);
            this.instance.on('error', (error) => {
                this.logger.error('redis error', { error });
            });
        }
    }

    public static getInstance(): RedisInstance {
        if (!this.instance) {
            throw new Error('Not initialize');
        }
        return this.instance;
    }

    public static shutdown(): void {
        this.logger.info('shutting down redis...');
        if (this.instance) {
            this.instance.disconnect();
        }
    }
}

export default RedisModule;
