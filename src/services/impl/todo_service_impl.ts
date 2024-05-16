import { Service, Context, Page } from '../../base';

import TodoRepository from 'src/repositories/todo_repository';
import ActivityRepository from 'src/repositories/activity_repository';
import TodoService from '../todo_service';
import { TodoProperties } from 'src/entity/models/todo';
import { PaginationQuery } from 'src/entity/dto/common';

export class TodoServiceImpl extends Service implements TodoService {
    private todoRepo: TodoRepository;
    private activityRepo: ActivityRepository;

    constructor(
        source: {
            todoRepo: TodoRepository,
            activityRepo: ActivityRepository
        }
    ) {
        super();
        this.todoRepo = source.todoRepo;
        this.activityRepo = source.activityRepo;
    }

    async createTodo(todo: TodoProperties, context: Context<number>): Promise<void> {
        await this.activityRepo.findOneOrFail({ id: todo.activity_id, user_id: context.user_id });
        await this.todoRepo.create(todo);
    }

    async getTodo(id: string): Promise<TodoProperties> {
        return this.todoRepo.findOneOrFail({ id });
    }

    async getTodoListByActivityId(activityId: string, query: PaginationQuery, context: Context<number>): Promise<Page<TodoProperties>> {
        await this.activityRepo.findOneOrFail({ id: activityId, user_id: context.user_id });
        return this.todoRepo.paginate({ activity_id: activityId }, query);
    }

    async updateTodo(todo: Partial<TodoProperties>, context: Context<number>): Promise<void> {
        await this.activityRepo.findOneOrFail({ id: todo.activity_id, user_id: context.user_id });
        await this.todoRepo.update({ id: todo.id }, todo);
    }

    async deleteTodo(id: string): Promise<void> {
        await this.todoRepo.delete({ id });
    }
}

export default TodoServiceImpl;
