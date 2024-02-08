import admin from 'firebase-admin';
import serviceAccount from './config/serviceAccountKey.json' assert {type: 'json'};
import { registerSchema } from './validation/registerSchema.mjs';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const handler = async (event) => {
    try {
        const userData = JSON.parse(event.body);
        const result = registerSchema.safeParse(userData);

        if (!result.success) {
            return {
                statusCode: 400,
                body: JSON.stringify(result.error),
            };
        }

        const { email, password } = result.data;

        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User registered successfully', user: userRecord }),
        };
    } catch (error) {
        console.error('Error registering user:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error registering user' }),
        };
    }
}