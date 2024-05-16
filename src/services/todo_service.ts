import { PaginationQuery } from 'src/entity/dto/common';
import { Context, Service, Page } from '../base';
import { TodoProperties } from 'src/entity/models/todo';

export interface TodoService extends Service {
    createTodo(todo: TodoProperties, context: Context): Promise<void>;
    getTodo(id: string): Promise<TodoProperties>;
    getTodoListByActivityId(activityId: string, query: PaginationQuery, context: Context): Promise<Page<TodoProperties>>;
    updateTodo(todo: Partial<TodoProperties>, context: Context): Promise<void>;
    deleteTodo(id: string): Promise<void>;
}

export default TodoService;
