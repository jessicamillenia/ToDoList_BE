import RedisContext from '../database/redis';
import { IObject } from '../typings';

export class RedisRepo<Model = any> extends RedisContext {
    private path: string;

    public constructor(path: string) {
        super();
        this.path = path;
    }

    private parse(serialize: any): Model {
        try {
            return JSON.parse(serialize);
        } catch (error) {
            return serialize;
        }
    }

    private stringify(object: any): string {
        if (typeof object === 'object') {
            return JSON.stringify(object);
        }
        return String(object);
    }

    public async get(key: string): Promise<Model | null> {
        try {
            const redisClient = RedisRepo.getInstance();
            return await redisClient
                .get(`${this.path}-${key}`)
                .then((res: string | null): Model | null => (res ? this.parse(res) : null));
        } catch (error) {
            this.logger.error(`fail getting redis key ${key}`, { error });
            return null;
        }
    }

    public async set(key: string, payload: Partial<Model>, expires?: number): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            const cacheKey = `${this.path}-${key}`;

            const cachePayload = this.stringify(payload);
            await redisClient.set(cacheKey, cachePayload);
            if (expires) {
                await this.setExpire(cacheKey, expires);
            }
        } catch (error) {
            this.logger.error(`fail setting redis key ${key}`, { error });
            return;
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            await redisClient.del(`${this.path}-${key}`);
        } catch (error) {
            this.logger.error(`fail deleting redis key ${key}`, { error });
            return;
        }
    }

    public async setHash(key: string, payload: Partial<Model>, expires?: number): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            const cachePayload = this.stringify(payload);
            await redisClient.hset(this.path, key, cachePayload);
            if (expires) {
                await this.setExpire(key, expires);
            }
        } catch (error) {
            this.logger.error(`fail setting redis hash key ${key}`, { error });
            return;
        }
    }

    public async getHash(key: string): Promise<Model | null> {
        try {
            const redisClient = RedisRepo.getInstance();
            return await redisClient.hget(this.path, key)
                .then((res: string | null): Model | null => (res ? this.parse(res) : null));
        } catch (error) {
            this.logger.error(`fail getting redis hash key ${key}`, { error });
            return null;
        }
    }

    public async getAllHash(): Promise<IObject> {
        try {
            const redisClient = RedisRepo.getInstance();
            return await redisClient.hgetall(this.path)
                .then((res: IObject): IObject => {
                    Object.keys(res).forEach(key => {
                        res[key] = this.parse(res[key]);
                    });
                    return res;
                });
        } catch (error) {
            this.logger.error(`fail getting all redis hash key of ${this.path}`, { error });
            return {};
        }
    }

    public async deleteHash(key: string): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            await redisClient.hdel(this.path, key);
        } catch (error) {
            this.logger.error(`fail deleting redis hash key ${key}`, { error });
            return;
        }
    }

    public async setExpire(key: string, time = 600): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            await redisClient.expire(key, time);
        } catch (error) {
            this.logger.error(`fail setting expires redis key ${key}`, { error });
            return;
        }
    }

    public async zAdd(key: string, score: number, memberIdentifier: number | string, expires?: number): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            const cacheKey = `${this.path}-${key}`;

            await redisClient.zadd(cacheKey, score, memberIdentifier);
            if (expires) {
                await this.setExpire(cacheKey, expires);
            }
        } catch (error) {
            this.logger.error(`fail zAdd redis key ${key}`, { error });
            return;
        }
    }

    public async zScore(key: string, memberIdentifier: number | string): Promise<number | null> {
        try {
            const redisClient = RedisRepo.getInstance();
            const cacheKey = `${this.path}-${key}`;

            return redisClient.zscore(cacheKey, memberIdentifier).
                then((res: string | null): number | null  => (res ? +res : null));

        } catch (error) {
            this.logger.error(`fail zScore redis key ${key}`, { error });
            return -1;
        }
    }

    public async zRem(key: string, memberIdentifier: number | string): Promise<void> {
        try {
            const redisClient = RedisRepo.getInstance();
            const cacheKey = `${this.path}-${key}`;

            await redisClient.zrem(cacheKey, memberIdentifier);
        } catch (error) {
            this.logger.error(`fail zRem redis key ${key}`, { error });
            return;
        }
    }
}

export default RedisRepo;
