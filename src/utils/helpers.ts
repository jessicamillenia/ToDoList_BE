import * as moment from 'moment';
import * as bcrypt from 'bcryptjs';
import * as otpGenerator from 'otp-generator';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { OTP_CONFIG } from '../entity/constant/auth';

const randomBytesAsync = promisify(crypto.randomBytes);

export class Helpers {
    static generateUuid = (): string => uuidv4();

    static async generateHashedPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return bcrypt.hash(password, salt);
    }

    static async comparePassword(password: string, expectedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, expectedPassword);
    }

    static async generateRandomToken(): Promise<string> {
        return randomBytesAsync(16)
            .then((buf) => buf.toString('hex'));
    }

    static async generateRandomTokenWithExpiration(expirationTimeInMinute: number): Promise<{
        token: string,
        validUntil: string
    }> {
        const token = await this.generateRandomToken();
        const validUntil = moment()
            .add(expirationTimeInMinute, 'minute')
            .utc()
            .format();

        return {
            token,
            validUntil,
        };
    }

    static getOTPEmailBypass(): string[] {
        return process.env.OTP_EMAIL_BYPASS ? process.env.OTP_EMAIL_BYPASS.split(',') : [];
    }

    static async generateOTP(email: string): Promise<string> {
        return ['local', 'development'].includes(String(process.env.NODE_ENV)) || this.getOTPEmailBypass().includes(email)
            ? OTP_CONFIG.OTP_DEV_VALUE
            : otpGenerator.generate(OTP_CONFIG.OTP_LENGTH, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false
            });
    }

    static async generateOTPWithExpiration(expirationTimeInMinute: number, email: string): Promise<{
        otp: string,
        validUntil: string
    }> {
        const otp = await this.generateOTP(email);
        const validUntil = moment()
            .add(expirationTimeInMinute, 'minute')
            .utc()
            .format();

        return {
            otp,
            validUntil,
        };
    }

    static isEmpty(val: string): boolean {
        return val === '' || val === null || val === undefined;
    }

    static isEmailValid(email: string): boolean {
        const emailRegex = /^[-!#$%&'*+/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
        const valid = emailRegex.test(email);

        if (!email) {
            return false;
        }

        if (email.length > 254) {
            return false;
        }

        if (!valid) {
            return false;
        }

        return true;
    }

    static capitalizeEachWord = (words: string): string => {
        const separateWord = words.toLowerCase().split(' ');
        for (let i = 0; i < separateWord.length; i++) {
            separateWord[i] = separateWord[i].charAt(0).toUpperCase()
                + separateWord[i].substring(1);
        }
        return separateWord.join(' ');
    };
}

export default Helpers;