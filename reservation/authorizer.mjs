import admin from 'firebase-admin';
import serviceAccount from '../user/config/serviceAccountKey.json' assert {type: 'json'};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export const handler = async (event, context) => {
    try {
        // Check if the authorization header is present
        const authorizationHeader = event.authorizationToken;
        if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
            context.fail('Unauthorized');
        }

        // Extract the token from the header
        const idToken = authorizationHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        context.succeed(generate_policy(uid, 'Allow', event.methodArn));
    } catch (error) {
        context.succeed(generate_policy('', 'Deny', event.methodArn));
    }
}

// A function to generate a response from Authorizer to API Gateway.
function generate_policy(principal_id, effect, resource) {
    return {
        principalId: principal_id,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
}
