import { SQLRepository } from '../base';
import { ActivityProperties } from '../entity/models/activity';

export type ActivityRepository = SQLRepository<ActivityProperties>

export default ActivityRepository;
