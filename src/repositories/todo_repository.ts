import { SQLRepository } from '../base';
import { TodoProperties } from '../entity/models/todo';

export type TodoRepository = SQLRepository<TodoProperties>

export default TodoRepository;
