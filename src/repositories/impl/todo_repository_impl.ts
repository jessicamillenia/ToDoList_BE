import { SQLRepository } from '../../base';
import { TodoProperties } from '../../entity/models/todo';
import { TodoRepository } from '../todo_repository';

export class TodoRepositoryImpl extends SQLRepository<TodoProperties> implements TodoRepository{
    constructor() {
        super('Todo');
    }
}
export default TodoRepositoryImpl;
