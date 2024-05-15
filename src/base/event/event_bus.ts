import EventSubscriber from './event_subscriber';
import { PublishOptions } from '../typings';

import { EventBusProvider } from './provider/event_bus_provider';
import KafkaProvider from './provider/kafka_provider';
import { generateDefaultContext } from '../utils/helpers';
import Logger from '../utils/logger';

export enum EventBusProviderName {
    CLOUD_PUBSUB = 'cloud-pubsub',
    KAFKA = 'kafka'
}

export interface EventBusOpts {
    provider?: EventBusProviderName;
    connection_string?: string;
    group_id?: string;
}

interface EventBusInstance {
    group_id: string;
    provider: EventBusProviderName;
    provider_instance: EventBusProvider;
}

export class EventBus extends Logger {
    static instance: EventBusInstance;

    public static get is_initialized(): boolean {
        return !!this.instance;
    }

    public static async initialize(options: EventBusOpts = {}): Promise<void> {
        const provider = options.provider ?? process.env.EVENT_BUS_PROVIDER ?? EventBusProviderName.KAFKA;
        const groupId = options.group_id ?? process.env.SERVICE_NAME;
        if (!groupId) {
            throw new Error('group id is not found for event bus');
        }

        const opts = { connection_string: options.connection_string, group_id: groupId };

        /** only kafka is supported */
        if (provider !== EventBusProviderName.KAFKA) {
            throw new Error('provider not supported yet');
        }

        const providerInstance = new KafkaProvider(opts);

        await providerInstance.initialize();

        this.instance = { provider, group_id: groupId, provider_instance: providerInstance };
        this.logger.info(`initializing ${provider} as event bus provider for ${groupId}`);
    }

    public static getProviderInstance(): EventBusProvider {
        if (!this.is_initialized) {
            throw new Error('event bus is not initialized');
        }
        return this.instance.provider_instance;
    }

    public static async addSubscriber(subscriber: EventSubscriber): Promise<void> {
        await this.instance.provider_instance.register(subscriber);
    }

    public static async publish<Payload extends Record<string, any>>(topicName: string, payload: Payload, opts?: PublishOptions): Promise<void> {
        const { context } = opts ?? {};
        const ctx = context ?? generateDefaultContext();

        await this.instance.provider_instance.publish(topicName, payload, { ...opts, context: ctx });
    }

    public static async publishBatch<Payloads extends Record<string, any>[]>(topicName: string, payloads: Payloads, opts?: PublishOptions): Promise<void> {
        const { context } = opts ?? {};
        const ctx = context ?? generateDefaultContext();

        await this.instance.provider_instance.publishBatch(topicName, payloads, { ...opts, context: ctx });
    }

    public static async shutdown(): Promise<void> {
        this.logger.info('shutting down event bus...');
        await this.instance.provider_instance.shutdown();
    }
}

export default EventBus;
