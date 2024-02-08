import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { loginSchema } from './validation/loginSchema.mjs';
import { firebaseApp } from "./config/firebase.mjs";

const auth = getAuth(firebaseApp);

export const handler = async (event) => {
    try {
        const userData = JSON.parse(event.body);
        const result = loginSchema.safeParse(userData);

        if (!result.success) {
            return {
                statusCode: 400,
                body: JSON.stringify(result.error),
            };
        }

        const { email, password } = result.data;

        // Sign in user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Login successful', user: userCredential.user }),
        };
    } catch (error) {
        console.log(error.code);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'The email address or password is incorrect' })
        };
    }
};
