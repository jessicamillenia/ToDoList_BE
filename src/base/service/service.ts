import { Transaction } from 'sequelize/types';
import { SQLContext } from '../database';
import { EventPublisher } from '../event';
import { ISOLATION_LEVELS } from '../utils';
import Logger from '../utils/logger';
import CacheService from './cache_service';

export abstract class Service extends Logger {

    protected event: EventPublisher;
    protected cache: CacheService;

    constructor() {
        super();
        this.event = new EventPublisher();
        this.cache = new CacheService();
    }

    protected createTransaction(isolation = ISOLATION_LEVELS.READ_UNCOMMITTED): Promise<Transaction> {
        return SQLContext.createTransaction(isolation);
    }

    protected async gracefulRollback(transaction: Transaction): Promise<void> {
        await SQLContext.gracefulRollback(transaction);
    }

}

export default Service;