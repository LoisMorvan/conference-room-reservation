import { object, string } from 'zod';

const MIN_PASSWORD_LENGTH = 8;

export const registerSchema = object({
    email: string().email(),
    password: string().min(MIN_PASSWORD_LENGTH, { message: 'Password must be at least 8 characters long' }),
});
