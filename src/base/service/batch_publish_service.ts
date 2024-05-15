import * as bluebird from 'bluebird';

import { BaseProps, Context, Page } from '../typings';
import Service from './service';
import { helpers } from '../utils';
import CacheService from './cache_service';
import { BadRequestError } from '../utils/http_error';
import { chunkArray, generateDefaultContext } from '../utils/helpers';

interface BatchOptions {
    per_batch?: number;
    per_batch_wait?: number;
    topic: string;
}

type SyncQuery = Record<any, any>

export abstract class BatchPublishService<Model extends BaseProps, PublishPayload extends Record<string, any> = any> extends Service {

    private perPage: number;
    private perBatchWait: number;
    private topic: string;
    private cacheService: CacheService;

    constructor({ per_batch: perPage, per_batch_wait: perBatchWait, topic }: BatchOptions) {
        super();
        this.perPage = perPage ?? 50;
        this.perBatchWait = perBatchWait ?? 0;
        this.topic = topic;
        this.cacheService = new CacheService();
    }

    abstract getPaginated(page: number, perPage: number): Promise<Page<Model>>

    abstract transform(data: Record<any, any>): PublishPayload

    private async checkOngoingProcess(): Promise<void> {
        const cacheKey = `ONGOING-${BatchPublishService.name.toLocaleUpperCase()}`;

        const hasOngoingProcess = await this.cacheService.get(cacheKey);
        if (hasOngoingProcess) {
            throw new BadRequestError('ongoing sync process', 'ONGOING_SYNC_PROCESS');
        }
        await this.cacheService.set(cacheKey, { has_ongoing: true }, 60);
    }

    public get(_query: SyncQuery): Promise<Model[]> {
        throw new Error('get method not implemented');
    }

    public async sync(query: SyncQuery, perPage = this.perPage, context: Context = generateDefaultContext()): Promise<void> {
        await this.checkOngoingProcess();
        const datas = await this.get(query);

        const mapped = datas.map(this.transform);
        const chunked = chunkArray(mapped, perPage);

        await bluebird.map(chunked, payloads => this.event.publishBatchMessage(this.topic, payloads, { context })
            .then(() => helpers.sleep(this.perBatchWait)), { concurrency: 1 });
    }

    public async syncAll(context: Context = generateDefaultContext()): Promise<void> {
        await this.checkOngoingProcess();
        const { meta: { total_data: totalData } } = await this.getPaginated(1, 1);

        const totalPage = Math.ceil(totalData / this.perPage);
        const pages = Array(totalPage).fill(1).map((_x, i) => i + 1);

        this.logger.info(`syncronizing total of ${totalData} datas of ${pages.length} pages`);

        await bluebird.map(pages, (page: number) => this.getPaginated(page, this.perPage)
            .then(({ data: datas }) => datas.map(this.transform))
            .then(payloads => this.event.publishBatchMessage(this.topic, payloads, { context }))
            .then(() => helpers.sleep(this.perBatchWait)), { concurrency: 1 });
    }

}

export default BatchPublishService;
