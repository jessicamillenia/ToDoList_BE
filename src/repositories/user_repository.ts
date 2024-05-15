import { SQLRepository } from '../base';
import { UserProperties } from '../entity/models/user';

export type UserRepository = SQLRepository<UserProperties>

export default UserRepository;
