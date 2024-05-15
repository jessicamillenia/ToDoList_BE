import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import * as random from 'randomstring';
import * as jose from 'node-jose';
import * as jws from 'jws';

export interface RefreshToken {
    token: string;
    valid_until: string;
}

export class Auth {
    private static SALT = 10;
    private static REFRESH_TOKEN_LENGTH = 50;
    private static REFRESH_TOKEN_LIFETIME = 7; // days

    public static generateToken<Claims extends Record<string, any>>(claims: Claims, withLifetime = true): { token: string; lifetime: number } {
        const lifetime = Number(process.env.JWT_LIFETIME ?? 3600);

        const options: jwt.SignOptions = {};
        if (withLifetime) {
            options.expiresIn = lifetime;
        }

        const token = jwt.sign(claims, String(process.env.JWT_SECRET ?? 'default'), options);

        return {
            token,
            lifetime
        };
    }

    public static verifyJwtToken(token: string): any {
        return jwt.verify(token, String(process.env.JWT_SECRET ?? 'default'));
    }

    public static async generateTokenWithJWK(payload: Record<string, any>): Promise<{ token: string; lifetime: number }> {
        const lifetime = Number(process.env.JWT_LIFETIME ?? 3600);

        const keyStore = await jose.JWK.asKeyStore(String(process.env.JWK_SECRET));
        const key = keyStore.get(String(process.env.JWK_KID));

        const opt = { compact: true, fields: { typ: 'JWT' } };
        const token = await jose.JWS.createSign(opt, key)
            .update(JSON.stringify(payload))
            .final();

        return {
            token: String(token),
            lifetime
        };
    }

    public static async verifyJwtTokenWithJWK(token: string): Promise<any> {
        const keyStore = await jose.JWK.asKeyStore(String(process.env.JWK_SECRET));
        const tokenObj = jws.decode(token);

        const kid = tokenObj?.header.kid as string;
        const key = keyStore.get(kid);

        await jose.JWS.createVerify(key).verify(token);

        return tokenObj?.payload;
    }

    public static generateRefreshToken(): RefreshToken {
        return {
            token: random.generate(Auth.REFRESH_TOKEN_LENGTH),
            valid_until: moment().add(Auth.REFRESH_TOKEN_LIFETIME, 'days').utc().format()
        };
    }

    public static generateHash(password: string): string {
        return bcrypt.hashSync(password, Auth.SALT);
    }

    public static validatePassword = (password: string, hash: string): boolean => {
        return bcrypt.compareSync(password, hash);
    };
}

export default Auth;
