import RateLimit from 'express-rate-limit';
import RateLimitRedis from 'rate-limit-redis';
import * as moment from 'moment';
import { RedisContext } from '../database';
import { RequestHandler } from 'express';
import { isTestEnvironment } from '../utils/helpers';
import { TooManyRequestsError } from '../utils/http_error';
import { TRUTHY } from '../utils';

const isSkipRateLimit = () => {
    return isTestEnvironment() || TRUTHY[String(process.env.DISABLE_RATE_LIMIT)];
};

/**
 * @param max total limit of endpoint hit
 * @param retryAfter seconds before endpoint can be hit again after reahing limit
 */
export const RateLimiter = (max = 5, retryAfter = 60): RequestHandler => {
    if (isSkipRateLimit()) {
        return (_req, _res, next) => next();
    }
    return RateLimit({
        store: new RateLimitRedis({
            // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
            sendCommand: (...args: string[]) => RedisContext.getInstance().call(...args),
        }),
        windowMs: retryAfter * 1000,
        max,
        handler: (req: any, res: any, next) => {
            const tryInSec = moment(req.rateLimit.resetTime).diff(moment(), 'seconds');
            return next(new TooManyRequestsError('api limit reach', 'API_LIMIT_REACH', { try_in: tryInSec }));
        },
        keyGenerator: (req: any, res: any) => {
            const ip = req.headers['cf-connecting-ip'] ?? req.ip;
            return `${req.method}-${req.path}-${ip}`;
        }
    });
};

export default {
    RateLimiter
};