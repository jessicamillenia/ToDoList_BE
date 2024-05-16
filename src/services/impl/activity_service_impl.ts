import { Service, Context, Page } from '../../base';

import ActivityRepository from 'src/repositories/activity_repository';
import ActivityService from '../activity_service';
import { ActivityProperties } from 'src/entity/models/activity';
import { PaginationQuery } from 'src/entity/dto/common';

export class ActivityServiceImpl extends Service implements ActivityService {
    constructor(private activityRepo: ActivityRepository) {
        super();
    }

    async createActivity(activity: Partial<ActivityProperties>, context: Context<number>): Promise<void> {
        await this.activityRepo.create({ ...activity, user_id: context.user_id });
    }

    async getActivity(id: string, context: Context<number>): Promise<ActivityProperties> {
        return this.activityRepo.findOneOrFail({ id, user_id: context.user_id });
    }

    async getActivityListByUserId(query: PaginationQuery, context: Context<number>): Promise<Page<ActivityProperties>> {
        return this.activityRepo.paginate({ user_id: context.user_id }, query);
    }

    async updateActivity(activity: Partial<ActivityProperties>, context: Context<number>): Promise<void> {
        const conditions = { id: activity.id, user_id: context.user_id };
        await this.activityRepo.findOneOrFail(conditions);
        await this.activityRepo.update(conditions, activity);
    }

    async deleteActivity(id: string, context: Context<number>): Promise<void> {
        const conditions = { id, user_id: context.user_id };
        await this.activityRepo.findOneOrFail(conditions);
        await this.activityRepo.delete(conditions);
    }
}

export default ActivityServiceImpl;
