import { Service, Context } from '../../base';

import UserRepository from 'src/repositories/user_repository';
import UserService from '../user_service';
import { UserProperties } from 'src/entity/models/user';
import { mapUserResponse } from 'src/entity/mapper/user_mapper';
import Helpers from 'src/utils/helpers';
import { BadRequestError } from 'src/base/utils/http_error';

export class UserServiceImpl extends Service implements UserService {
    constructor(private userRepo: UserRepository) {
        super();
    }

    async getUser(id: number): Promise<Partial<UserProperties>> {
        const user = await this.userRepo.findOneOrFail({ id });
        return mapUserResponse(user);
    }

    async updatePassword(newPassword: string, context: Context): Promise<void> {
        const user = await this.userRepo.findOneOrFail({ id: context.user_id }, ['password', 'id']);

        const isPasswordEqual = await Helpers.comparePassword(newPassword, user.password);
        if (isPasswordEqual) {
            throw new BadRequestError('The new password cannot be the same as the old one.', 'PASSWORD_EQUAL');
        }

        await this.userRepo.update({ id: user.id }, {
            password: await Helpers.generateHashedPassword(newPassword)
        });
    }

    async updateUser(user: Partial<UserProperties>, context: Context): Promise<void> {
        await this.userRepo.findById(context.user_id, ['id']);
        await this.userRepo.update({ id: context.user_id }, user);
    }
}

export default UserServiceImpl;