import { SQLRepository } from '../../base';
import { UserProperties } from '../../entity/models/user';
import { UserRepository } from '../user_repository';

export class UserRepositoryImpl extends SQLRepository<UserProperties> implements UserRepository{
    constructor() {
        super('User');
    }
}
export default UserRepositoryImpl;
