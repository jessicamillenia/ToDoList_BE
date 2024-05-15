import { Kafka, CompressionTypes, IHeaders, Producer, ConsumerConfig, KafkaMessage, Consumer } from 'kafkajs';
import * as bluebird from 'bluebird';

import { EventMetadata, PublishOptions } from '../../typings';
import EventSubscriber from '../event_subscriber';
import EventBusProvider from './event_bus_provider';
import { InternalServerError } from '../../utils/http_error';
import { INTERNAL_TOPICS } from '../../utils';
import { createKafkaInstance, getContextFromHeaders } from '../../libs/kafka';
import { createInterval } from '../../utils/interval';

export interface KafkaProviderOpts {
    connection_string?: string;
    group_id: string;
}

interface DoRetryWrapper {
    isSuccess: boolean;
    isRetry: boolean;
    message: KafkaMessage;
    metadata: EventMetadata;
    subscriber: EventSubscriber<Record<string, any>>;
}

export class KafkaProvider extends EventBusProvider {
    private instance: Kafka;
    private producer: Producer;
    private consumers: Map<string, Consumer> = new Map();

    constructor(options: KafkaProviderOpts) {
        super(options);
        this.instance = this.createKafkaInstance(options);
        this.producer = this.instance.producer({ allowAutoTopicCreation: true });
    }

    private createKafkaInstance(options: KafkaProviderOpts): Kafka {
        return createKafkaInstance(options);
    }

    public async initialize(): Promise<void> {
        await this.producer.connect();
    }

    private getMetadataFromHeaders(headers: IHeaders): EventMetadata {
        return {
            origin: headers.origin?.toString() ?? 'unknown',
            retry_id: headers.retry_id?.toString(),
            retry_attempt: Number(headers.retry_attempt?.toString() ?? 0),
            retry_destination: headers.retry_destination?.toString(),
        };
    }

    private generateRetryMessagePayload(message: KafkaMessage, subscriber: EventSubscriber<Record<string, any>>): Record<string, any> {
        /** carry headers but replace origin with current service name */
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(message.headers!)) {
            headers[key] = value!.toString();
        }
        headers.origin = String(process.env.SERVICE_NAME);

        return {
            message: {
                value: JSON.parse(message.value!.toString()),
                headers: headers,
            },
            subscriber: subscriber.retry_config,
        };
    }

    private getConsumerConfig(subscriber: EventSubscriber<Record<string, any>>): ConsumerConfig {
        const subscriptionGroupId = `${this.groupId}-${subscriber.topicName}`;
        return {
            groupId: subscriptionGroupId,
            maxInFlightRequests: subscriber.maxInProgress,
            sessionTimeout: 10000, // 10 secs
            retry: {
                retries: subscriber.retries,
                multiplier: subscriber.backoffRetry,
            }
        };
    }

    private isRetryForOtherService(metadata: EventMetadata): boolean {
        if (!metadata.retry_destination) {
            return false;
        }
        return metadata.retry_destination !== String(process.env.SERVICE_NAME);
    }

    private async doRetryOrAckIfNeeded({ isRetry, isSuccess, message, metadata, subscriber }: DoRetryWrapper): Promise<void> {
        if (isRetry) {
            await this.publish(INTERNAL_TOPICS.RETRY_MESSAGE_STATUS, { is_success: isSuccess, id: metadata.retry_id });
            return;
        }

        if (isSuccess) {
            return;
        }

        if (subscriber.is_retryable) {
            const retryPayload = this.generateRetryMessagePayload(message, subscriber);
            await this.publish(INTERNAL_TOPICS.RETRY_MESSAGE, retryPayload);
        }
    }

    public async register(subscriber: EventSubscriber<Record<string, any>>): Promise<void> {
        const topicName = subscriber.topicName;
        const config = this.getConsumerConfig(subscriber);
        const groupId = config.groupId;

        const consumer = this.instance.consumer(config);

        consumer.on(consumer.events.CRASH, (event) => {
            const error = event.payload.error;
            this.logger.error('on %s', groupId, { error });
        });

        consumer.on(consumer.events.REQUEST_TIMEOUT, (event) => {
            const error = new InternalServerError('kafka consumer timeout', 'CONSUMER_TIMEOUT', event.payload);
            this.logger.error('on %s', groupId, { error });
        });

        consumer.on(consumer.events.REBALANCING, (event) => {
            this.logger.info('consumer group %s is rebalancing', groupId, { data: event.payload });
        });

        consumer.on(consumer.events.GROUP_JOIN, (event) => {
            this.logger.info('consumer is joining %s as a %s', groupId,  event.payload.isLeader ? 'leader' : 'follower', { data: event });
        });

        consumer.on(consumer.events.DISCONNECT, (event) => {
            this.logger.warn('consumer is disconnecting %s', groupId, { data: event });
        });

        await consumer.connect();
        await consumer.subscribe({
            topic: topicName
        });

        await consumer.run({
            partitionsConsumedConcurrently: subscriber.partitionConsumed,
            eachMessage: async ({ topic, message, heartbeat }) => {
                let isSuccess = true;
                const metadata = this.getMetadataFromHeaders(message.headers!);

                const isRetry = !!metadata.retry_id;
                const isForOtherService = this.isRetryForOtherService(metadata);

                if (isForOtherService) {
                    this.logger.info('message is a retry for other service, ignoring...', { metadata });
                    return;
                } else if (isRetry) {
                    this.logger.info('retrying %s message with retry_id %s', subscriber.topicName, metadata.retry_id, { metadata });
                }

                const context = getContextFromHeaders(message.headers!);

                /** this will ensure that a task can run as long as it needed */
                const heartbeatInterval = createInterval(async () => {
                    await heartbeat();
                }, 3000);
                heartbeatInterval.start();

                try {
                    const payload = JSON.parse(message.value!.toString());
                    await subscriber.handler(payload, context, metadata);
                } catch (error: any) {
                    isSuccess = false;
                    this.logger.error(`Fail executing ${topic}`, { context, error });
                } finally {
                    heartbeatInterval.forceExecution();
                    heartbeatInterval.stop();
                }

                await this.doRetryOrAckIfNeeded({ isRetry, isSuccess ,message, metadata, subscriber });
            },
        });

        this.consumers.set(groupId, consumer);
    }

    public async publish<Payload extends Record<string, any>>(topicName: string, payload: Payload, opts?: PublishOptions): Promise<void> {
        const { context, destination, key } = opts ?? {};
        const headers = this.generateHeaders(context, destination);
        await this.producer.send({
            topic: topicName,
            messages: [
                { value: JSON.stringify(payload), headers, key },
            ],
            compression: CompressionTypes.GZIP
        });
    }

    public async publishBatch<Payloads extends Record<string, any>[]>(topicName: string, payloads: Payloads, opts?: PublishOptions): Promise<void> {
        const { context, destination, key } = opts ?? {};
        const headers = this.generateHeaders(context, destination);
        await bluebird.map(payloads, payload => this.producer.send({
            topic: topicName,
            messages: [
                { value: JSON.stringify(payload), headers, key },
            ],
            compression: CompressionTypes.GZIP
        }), { concurrency: payloads.length });
    }

    public async shutdown(): Promise<void> {
        await this.producer.disconnect();
        await bluebird.map(this.consumers.values(), consumer => consumer.disconnect(), { concurrency: this.consumers.size });
    }

}

export default KafkaProvider;
