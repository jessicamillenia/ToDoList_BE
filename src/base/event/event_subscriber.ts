import { Context, EventMetadata } from '../typings';
import { camelToSnakeCase } from '../utils/helpers';
import Logger from '../utils/logger';

export interface SubscriberMeta {
    topicName: string;
    handlerName: string;
    endpoint: string;
    type: string;
}

export enum SubscriberType {
    PULL = 'pull',
    PUSH = 'push'
}

interface EventSubscriberOptions {
    topic: string;
    retryable?: boolean;
    type?: SubscriberType;
    maxInProgress?: number;
    retries?: number;
    backoffRetry?: number;
    partitionConsumed?: number;
}

export abstract class EventSubscriber<Payload extends Record<string, any> = Record<string, any>> extends Logger {
    private _topicName: string;
    private _type: SubscriberType;
    private _maxInProgress: number;
    private _retries: number;
    private _backoffRetry: number;
    private _retryable: boolean;
    private _partitionConsumed: number;

    constructor(options: EventSubscriberOptions) {
        super();
        this._topicName = options.topic;
        this._type = options.type ?? SubscriberType.PULL;
        this._maxInProgress = options.maxInProgress ?? 10;
        this._retries = options.retries ?? 10;
        this._backoffRetry = options.backoffRetry ?? 5;
        this._retryable = options.retryable ?? true;
        this._partitionConsumed = options.partitionConsumed ?? 3;
    }

    public get topicName(): string {
        return this._topicName;
    }

    public get type(): string {
        return this._type;
    }

    public get path(): string {
        return `/subscribers/${camelToSnakeCase(this.constructor.name, '-')}`;
    }

    public get maxInProgress(): number {
        return this._maxInProgress;
    }

    public get retries(): number {
        return this._retries;
    }

    public get backoffRetry(): number {
        return this._backoffRetry;
    }

    public get is_retryable(): boolean {
        return this._retryable;
    }

    public get partitionConsumed(): number {
        return this._partitionConsumed;
    }

    public get retry_config(): Record<string, string | number | boolean> {
        return {
            topic: this.topicName,
            retries: this.retries,
            backoff_retry: this.backoffRetry,
            retryable: this.is_retryable,
            partitionConsumed: this.partitionConsumed
        };
    }

    abstract handler(payload: Payload, context: Context, metadata?: EventMetadata): Promise<void>
}

export type StaticEventSubscriber = new (...params: any[]) => EventSubscriber;

export default EventSubscriber;
