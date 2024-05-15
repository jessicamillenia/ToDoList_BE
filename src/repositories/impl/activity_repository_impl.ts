import { SQLRepository } from '../../base';
import { ActivityProperties } from '../../entity/models/activity';
import { ActivityRepository } from '../activity_repository';

export class ActivityRepositoryImpl extends SQLRepository<ActivityProperties> implements ActivityRepository{
    constructor() {
        super('Activity');
    }
}
export default ActivityRepositoryImpl;
