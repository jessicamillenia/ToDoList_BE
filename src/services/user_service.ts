import { Context, Service } from '../base';
import { UserProperties } from 'src/entity/models/user';

export interface UserService extends Service {
    getUser(id: number): Promise<Partial<UserProperties>>;
    updatePassword(newPassword: string, context: Context): Promise<void>;
    updateUser(user: Partial<UserProperties>, context: Context): Promise<void>;
}

export default UserService;
