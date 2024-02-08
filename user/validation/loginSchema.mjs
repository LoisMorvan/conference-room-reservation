import { object, string } from 'zod';

export const loginSchema = object({
    email: string().email(),
    password: string().min(1)
});
