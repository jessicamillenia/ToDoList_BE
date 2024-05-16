import { PaginationQuery } from 'src/entity/dto/common';
import { Context, Service, Page } from '../base';
import { ActivityProperties } from 'src/entity/models/activity';

export interface ActivityService extends Service {
    createActivity(activity: Partial<ActivityProperties>, context: Context): Promise<void>;
    getActivity(id: string, context: Context): Promise<ActivityProperties>;
    getActivityListByUserId(query: PaginationQuery, context: Context): Promise<Page<ActivityProperties>>;
    updateActivity(activity: Partial<ActivityProperties>, context: Context): Promise<void>;
    deleteActivity(id: string, context: Context): Promise<void>;
}

export default ActivityService;
