import { Controller as BaseController, Context, RequestData, JWTMiddleware } from '../base';

import ActivityService from 'src/services/activity_service';

import { API_ROUTE, MESSAGE_RESPONSE } from '../entity/constant/common';
import { CREATE_ACTIVITY, GET_ACTIVITY_LIST, REQUIRED_ACTIVITY_ID, UPDATE_ACTIVITY } from 'src/entity/validation/activity';

class ActivityController extends BaseController {
    constructor(
        private activityService: ActivityService,
    ) {
        super({ path: API_ROUTE.ACTIVITY });
    }

    async createActivity(data: RequestData, context: Context): Promise<any> {
        await this.activityService.createActivity(data.body, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async updateActivity(data: RequestData, context: Context): Promise<any> {
        await this.activityService.updateActivity(data.body, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async getActivity(data: RequestData, context: Context): Promise<any> {
        const { activity_id: activityId } = data.body;
        return this.activityService.getActivity(activityId, context);
    }

    async getActivityListByUserId(data: RequestData, context: Context): Promise<any> {
        return this.activityService.getActivityListByUserId(data.query, context);
    }

    async deleteActivity(data: RequestData, context: Context): Promise<any> {
        const { activity_id: activityId } = data.body;
        await this.activityService.deleteActivity(activityId, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    setRoutes(): void {
        this.addRoute('get', '/', this.getActivity.bind(this), {
            validate: REQUIRED_ACTIVITY_ID,
            middlewares: JWTMiddleware
        });
        this.addRoute('get', '/list', this.getActivityListByUserId.bind(this), {
            validate: GET_ACTIVITY_LIST,
            middlewares: JWTMiddleware
        });
        this.addRoute('post', '/', this.createActivity.bind(this), {
            validate: CREATE_ACTIVITY,
            middlewares: JWTMiddleware
        });
        this.addRoute('put', '/', this.updateActivity.bind(this), {
            validate: UPDATE_ACTIVITY,
            middlewares: JWTMiddleware
        });
        this.addRoute('delete', '/', this.deleteActivity.bind(this), {
            validate: REQUIRED_ACTIVITY_ID,
            middlewares: JWTMiddleware
        });
    }
}

export default ActivityController;