import EventBus from './event_bus';
import { PublishOptions } from '../typings';

export class EventPublisher extends EventBus {

    public async publishMessage<Payload extends Record<string, any>>(topicName: string, payload: Payload, opts?: PublishOptions): Promise<void> {
        await EventBus.publish(topicName, payload, opts);
    }

    public async publishBatchMessage<Payloads extends Array<Record<string, any>>>(topicName: string, payloads: Payloads, opts?: PublishOptions): Promise<void> {
        await EventBus.publishBatch(topicName, payloads, opts);
    }
}

export default EventPublisher;
