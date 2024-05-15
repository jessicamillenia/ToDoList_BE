import { RedisRepo } from '../repository';

export class CacheService extends RedisRepo {
    public constructor(){
        super('CacheService');
    }
}

export default CacheService;
