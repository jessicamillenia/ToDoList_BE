import { RouteMeta } from '../controller';
import { EventSubscriber, SubscriberMeta } from '../event';
import { DEFAULT, HttpMethod } from './constant';

export const generateSubscriberRouteMeta = (subscriber: EventSubscriber): RouteMeta => {
    return {
        httpMethod: HttpMethod.POST,
        methodName: subscriber.constructor.name,
        path: subscriber.path,
        controller: DEFAULT.SUBS_TEST_CONTROLLER
    };
};

export const generateSubscriberMeta = (subscriber: EventSubscriber): SubscriberMeta => {
    return {
        topicName: subscriber.topicName,
        handlerName: subscriber.constructor.name,
        endpoint: subscriber.path,
        type: subscriber.type
    };
};