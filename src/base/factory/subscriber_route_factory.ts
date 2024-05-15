import { RequestHandler, Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EventSubscriber } from '../event';
import { headersToContext } from '../utils/helpers';
import { InternalServerError } from '../utils/http_error';

const SubscriberRouteFactory = (subscriber: EventSubscriber): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const context = headersToContext(req.headers);
            await subscriber.handler(req.body || {}, context);
            return res.status(StatusCodes.OK).json({
                message: `${subscriber.constructor.name} successfully executed`
            });
        } catch (error: any) {
            return next(new InternalServerError(`fail executing ${subscriber.constructor.name}, ${error.message}`));
        }
    };
};

export default SubscriberRouteFactory;
