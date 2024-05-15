import axios, { AxiosInstance, Method } from 'axios';
import { setImmediate } from 'async';

import { IObject } from '../typings';
import { HttpError, InternalServerError } from '../utils/http_error';
import Logger from '../utils/logger';
import { Agent } from 'http';

interface OutboundHeader {
    [s:string]: any;
}

export interface OutboudOptions {
    method?: Method
    headers?: OutboundHeader;
}

export interface OutboundServiceOptions {
    carryInternalError: boolean;
}

const defaultOptions: OutboundServiceOptions = {
    carryInternalError: false
};

export abstract class OutboundService extends Logger {
    protected caller: AxiosInstance;
    protected options: OutboundServiceOptions;

    constructor(url: string, opts: OutboundServiceOptions = defaultOptions) {
        super();
        this.caller = axios.create({ baseURL: url, httpAgent: new Agent({ keepAlive: false }) });
        this.options = opts;
    }

    private async doCall<T>(path: string, data?: IObject, options?: OutboudOptions): Promise<T> {
        const { data: response } = await this.caller({
            method: options?.method ?? 'post',
            url: path, data,
            headers: options?.headers
        });
        return response;
    }

    protected async call<T>(path: string, data?: IObject, options?: OutboudOptions): Promise<T> {
        try {
            return await this.doCall<T>(path, data, options);
        } catch (err: any) {
            const pathName = path.split('?')[0];
            this.logger.error(`outboud call to ${pathName} fail, ${err.message}`);
            if (this.options.carryInternalError && axios.isAxiosError(err) && err.response) {
                const data = err.response.data;
                throw new HttpError({  name: data.error_name, http_status: err.response.status, message: data.error_message, code: data.error_code, data: data.error_data });
            }
            throw new InternalServerError(`outboud call to ${pathName} fail, ${err.message}`, 'OUTBOUND_FAIL');
        }
    }

    protected async callAsync(path: string, data?: IObject, options?: OutboudOptions): Promise<void> {
        setImmediate(async () => {
            try {
                await this.doCall(path, data, options);
            } catch (error: any) {
                const pathName = path.split('?')[0];
                this.logger.error(`outboud call to ${pathName} fail`, error);
            }
        });
    }
}

export default OutboundService;
