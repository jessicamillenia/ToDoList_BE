import { Controller as BaseController, Context, RequestData, JWTMiddleware } from '../base';

import TodoService from 'src/services/todo_service';

import { API_ROUTE, MESSAGE_RESPONSE } from '../entity/constant/common';
import { CREATE_TODO, GET_TODO_LIST, REQUIRED_TODO_ID, UPDATE_TODO } from 'src/entity/validation/todo';

class TodoController extends BaseController {
    constructor(
        private todoService: TodoService,
    ) {
        super({ path: API_ROUTE.TODO });
    }

    async createTodo(data: RequestData, context: Context): Promise<any> {
        await this.todoService.createTodo(data.body, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async updateTodo(data: RequestData, context: Context): Promise<any> {
        await this.todoService.updateTodo(data.body, context);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    async getTodo(data: RequestData): Promise<any> {
        const { todo_id: todoId } = data.body;
        return this.todoService.getTodo(todoId);
    }

    async getTodoListByActivityId(data: RequestData, context: Context): Promise<any> {
        const { activity_id: activityId } = data.body;
        return this.todoService.getTodoListByActivityId(activityId, data.query, context);
    }

    async deleteTodo(data: RequestData): Promise<any> {
        const { todo_id: todoId } = data.body;
        await this.todoService.deleteTodo(todoId);
        return {
            message: MESSAGE_RESPONSE.SUCCEED
        };
    }

    setRoutes(): void {
        this.addRoute('get', '/', this.getTodo.bind(this), {
            validate: REQUIRED_TODO_ID,
            middlewares: JWTMiddleware
        });
        this.addRoute('get', '/list', this.getTodoListByActivityId.bind(this), {
            validate: GET_TODO_LIST,
            middlewares: JWTMiddleware
        });
        this.addRoute('post', '/', this.createTodo.bind(this), {
            validate: CREATE_TODO,
            middlewares: JWTMiddleware
        });
        this.addRoute('put', '/', this.updateTodo.bind(this), {
            validate: UPDATE_TODO,
            middlewares: JWTMiddleware
        });
        this.addRoute('delete', '/', this.deleteTodo.bind(this), {
            validate: REQUIRED_TODO_ID,
            middlewares: JWTMiddleware
        });
    }
}

export default TodoController;