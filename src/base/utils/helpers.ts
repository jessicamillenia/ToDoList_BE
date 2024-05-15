import * as moment from 'moment';
import * as uuid from 'uuid';
import { IObject, Context } from '../typings/common';
import { MANDATORY_REQUEST_HEADER } from './constant';

export const parseDataObject = (object: IObject): IObject => JSON.parse(JSON.stringify(object));

export const offset = (page = 1, per_page = 10): number => (page - 1) * per_page;

export const isEmptyObject = (object: IObject): boolean => !Object.keys(object).length;

export const isEmptyArray = (array: any[]): boolean => array.length === 0;

export const trimObjectKey = (object: IObject): IObject => {
    Object.keys(object).forEach(
        (key: string): boolean =>
            (object[key] === null || object[key] === '' || object[key] === undefined) && delete object[key]
    );
    return object;
};

export const stringifyObjectKey = (object: IObject): IObject => {
    Object.keys(object).forEach((key: string): void => {
        object[key] = String(object[key]);
    });
    return object;
};

export const sorter = (sort = '-created_at'): string[] => {
    let sortString = sort;
    let sortMethod;

    if (sortString.startsWith('-')) {
        sortMethod = 'DESC';
        sortString = sort.substring(1);
    } else {
        sortMethod = 'ASC';
    }

    return [sortString, sortMethod];
};

export const timestamp = (): string => moment().utc().toISOString();

export const spitTrim = (str: string, delimiter = ','): string[] => {
    return str.split(delimiter).map(i => i.trim()).filter(i => i);
};

export const camelToSnakeCase = (str: string, delimiter = '_'): string => str[0].toLowerCase() + str.slice(1, str.length).replace(/[A-Z]/g, letter => `${delimiter}${letter.toLowerCase()}`);

export const isServerError = (statusCode: number): boolean => {
    return String(statusCode).startsWith('5');
};

export const contextToHeaders = (context: Context): Record<string, any> => {
    return {
        [MANDATORY_REQUEST_HEADER.REQUEST_ID]: context.request_id || '',
        [MANDATORY_REQUEST_HEADER.USER_ID]: context.user_id || ''
    };
};

export const headersToContext = (headers: any): Context => { // eslint-disable-line
    return {
        request_id: headers[MANDATORY_REQUEST_HEADER.REQUEST_ID] || getTraceId(),
        user_id: headers[MANDATORY_REQUEST_HEADER.USER_ID] || null
    };
};

export const objectValueToString = (data: Record<string, any>): Record<string, string> => {
    const object = { ...data };
    return Object.keys(object).reduce((acc: Record<string, string>, item: string) => {
        if (object[item]) { acc[item] = String(object[item]); }
        return acc;
    }, {});
};

export const titleCase = (text: string): string => text.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

export const isTestEnvironment = (): boolean => process.env.NODE_ENV === 'test';

export const isDevEnvironment = (): boolean => ['local', 'development'].includes(String(process.env.NODE_ENV));

export const generateDatabaseConfig = (env: string): Record<string, any> => {
    const [dialect, temp] = env.split('://');
    const [credential, temp2] = temp.split('@');
    const [username, password = ''] = credential.split(':');
    const [server, database] = temp2.split('/');
    const [host, port] = server.split(':');
    return {
        username,
        password,
        database,
        port,
        host,
        dialect
    };
};

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const chunkArray = <Model = any>(myArray: Model[], chunkSize: number): Model[][] => {
    let index;
    let myChunk: Model[];

    const arrayLength = myArray.length;
    const tempArray = [];

    for (index = 0; index < arrayLength; index += chunkSize) {
        myChunk = myArray.slice(index, index + chunkSize);
        tempArray.push(myChunk);
    }

    return tempArray;
};

export const getTraceId = (): string => {
    return uuid.v4();
};

export const generateDefaultContext = (): Context => {
    const traceId = getTraceId();
    return { request_id: traceId, user_id: 0 };
};

export const decodeBase64 = (data: string | null): string => {
    return Buffer.from(data ?? '', 'base64').toString();
};

export const generateRandomString = (length = 6): string => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i += 1) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
};

export default {
    timestamp,
    parseDataObject,
    offset,
    isEmptyArray,
    isEmptyObject,
    trimObjectKey,
    stringifyObjectKey,
    spitTrim,
    camelToSnakeCase,
    isServerError,
    contextToHeaders,
    headersToContext,
    objectValueToString,
    titleCase,
    isTestEnvironment,
    sleep,
    getTraceId,
    decodeBase64,
    generateRandomString
};
