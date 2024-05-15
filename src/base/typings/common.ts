import { Transaction as SequelizeTransaction } from 'sequelize';

export interface IObject<D = any> {
    [s: string]: D;
}

export interface PaginationMeta {
    page: number;
    per_page: number;
    total_page: number;
    total_data: number;
}

export interface Page<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface RequestData<Query = any, Params = any, Body = any, Files = any, Headers = any> {
    query: Query;
    params: Params;
    body: Body;
    files?: Files;
    headers: Headers;
}

export type RawResponseData = string | Buffer | Uint8Array;

export interface FileData {
    buffer: Buffer;
    options?: {
        mimeType: string;
        fileName: string;
        size: number;
    }
}

export interface ResponseData<Data = any> {
    redirect?: string;
    data?: Data;
    message?: string;
    code?: number;
    file?: FileData;
    html?: string;
    headers?: Record<string, string>;
}

export type HandlerMethod<HandlerOutput extends ResponseData = any> = (data: RequestData, context: Context<any>) => Promise<HandlerOutput>;

export type MakeAny<T> = {
    [P in keyof T]?: any;
};

export type BasicType<T> = {
    [P in keyof T]?: P extends string | number | boolean ? T[P] : never;
};

export type OptionalRelation = IObject[] | undefined;

export type Attributes = string[];

export interface QueryOptions {
    page?: number;
    per_page?: number;
    sort?: string;
    attributes?: Attributes;
    cache?: boolean;
}

export interface BaseProps {
    id: string | number;
    created_at: string | null;
    updated_at: string | null;
    deleted_at?: string | null;
}

export interface GenericStaticClass<ClassInstance> {
    new(...params: any): ClassInstance
}

export type ModelProperties<ModelClass extends GenericStaticClass<ModelClass>> = ConstructorParameters<ModelClass>[0];

export interface Context<IDType = number> {
    request_id: string;
    user_id: IDType;
    [s:string]: any;
}

export interface JwtAuthClaims {
    user_id: number;
}

export interface ErrorResponse {
    error_name: string;
    error_message: string;
    error_code: string;
    error_data?: any;
}

export type Transaction = SequelizeTransaction;

export interface EventMetadata {
    origin: string;
    retry_id?: string;
    retry_attempt?: number;
    retry_destination?: string;
}

export interface PublishOptions {
    context?: Context;
    key?: string;
    destination?: string;
}