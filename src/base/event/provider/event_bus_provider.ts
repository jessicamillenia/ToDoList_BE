import * as zlib from 'zlib';
import * as uuid from 'uuid';

import { Context, EventMetadata, PublishOptions } from '../../typings';
import { objectValueToString } from '../../utils/helpers';
import Logger from '../../utils/logger';
import EventSubscriber from '../event_subscriber';

export abstract class EventBusProvider extends Logger {

    protected groupId: string;

    constructor(options: { group_id: string }) {
        super();
        this.groupId = options.group_id;
    }

    public abstract initialize(): Promise<void>;

    protected decompress(data: Buffer): Record<string, unknown> {
        try {
            const buffer = zlib.unzipSync(data);
            return JSON.parse(buffer.toString());
        } catch (err) {
            return {};
        }
    }

    protected compress(data: Record<string, any>): Buffer {
        const stringified = JSON.stringify(data);
        return zlib.gzipSync(stringified);
    }

    protected generateHeaders(context?: Context, destination?: string): Record<string, string> {
        const metadata: EventMetadata = {
            origin: process.env.SERVICE_NAME ? String(process.env.SERVICE_NAME) : 'unknown'
        };

        if (destination) {
            metadata.retry_destination = destination;
        }

        return objectValueToString({
            ...{ request_id: uuid.v4() },
            ...context,
            ...metadata
        });
    }

    public abstract publish<Payload extends Record<string, any>>(topicName: string, payload: Payload, opts?: PublishOptions): Promise<void>;

    public abstract publishBatch<Payloads extends Array<Record<string, any>>>(topicName: string, payloads: Payloads, opts?: PublishOptions): Promise<void>;

    public abstract register(subscriber: EventSubscriber): Promise<void>;

    public abstract shutdown(): Promise<void>;
}

export default EventBusProvider;
