import { IHeaders, Kafka, SASLOptions, logLevel } from 'kafkajs';
import { Context } from '../typings';
import { getTraceId } from '../utils/helpers';
import { EMPTY_CONTEXT } from '../utils';
import { LoggerModule } from '../utils/logger';

interface KafkaOpts {
    group_id: string;
    connection_string?: string;
}

export const createKafkaInstance = (options: KafkaOpts): Kafka => {
    const connectionString = options.connection_string ?? process.env.KAFKA_BROKER_URL;
    if (!connectionString) {
        throw new Error('no connection string found for kafka event bus provider');
    }

    let saslOpts: SASLOptions | null = null;
    const kafkaAuthMethod = process.env.KAFKA_AUTHENTICATION_METHOD;
    if (kafkaAuthMethod) {
        switch (kafkaAuthMethod) {
        case 'aws': {
            saslOpts = {
                mechanism: kafkaAuthMethod,
                authorizationIdentity: String(process.env.AWS_AUTHORIZATION_IDENTITY),
                accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
                secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY)
            };
            break;
        }
        case 'plain':
        case 'scram-sha-256':
        case 'scram-sha-512': {
            saslOpts = {
                mechanism: kafkaAuthMethod,
                username: String(process.env.KAFKA_BROKER_USERNAME),
                password: String(process.env.KAFKA_BROKER_PASSWORD)
            };
            break;
        }
        default:
            break;
        }
    }

    return new Kafka({
        clientId: options.group_id,
        brokers: getBrokersFromConnectionString(connectionString),
        sasl: saslOpts ?? undefined,
        ssl: process.env.KAFKA_USE_SSL === 'true',
        logLevel: logLevel.ERROR,
        logCreator: getLoggerInstance
    });
};

export const getBrokersFromConnectionString = (connectionString: string): string[] => {
    return connectionString.split(',').map(item => item.trim());
};

export const getContextFromHeaders = (headers: IHeaders): Context => {
    try {
        return {
            user_id: Number(headers.user_id?.toString() ?? 0),
            request_id: headers.request_id?.toString() ?? getTraceId(),
        };
    } catch (error) {
        return EMPTY_CONTEXT;
    }
};

const getLoggerInstance = (): any => {
    const logger = LoggerModule.getInstance().logger;
    return ({ log, level }: { log: any, level: number }) => {
        const { message, ...extra } = log;
        logger.log({ level: toWinstonLogLevel(level), message, ...extra });
    };
};

const toWinstonLogLevel = (level: number): string => {
    switch(level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
        return 'error';
    case logLevel.WARN:
        return 'warn';
    case logLevel.INFO:
        return 'info';
    case logLevel.DEBUG:
        return 'debug';
    default:
        return 'debug';
    }
};