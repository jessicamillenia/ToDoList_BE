import { UserProperties } from '../models/user';

export const mapUserResponse = (user: UserProperties): Partial<UserProperties> => ({
    id: user.id,
    email: user.email,
    email_verified: user.email_verified,
    fullname: user.fullname
});
