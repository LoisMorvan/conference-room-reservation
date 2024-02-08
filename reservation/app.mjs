import { MongoClient, ServerApiVersion } from "mongodb";
import mailgun from 'mailgun.js';
import FormData from 'form-data';

const uri = 'mongodb+srv://lmorvan:lmorvan@lambda.v6kkphq.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const Mailgun = new mailgun(FormData);
const mg = Mailgun.client({
    username: 'api',
    key: '5eadd1283683e8f1878561e7fddb4ab3-8c90f339-505a2aa6',
});

export const handler = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { roomNumber, date, details } = requestBody;

        // zod 

        const isAvailable = await checkAvailability(roomNumber, date);

        if (isAvailable) {
            await createReservation(roomNumber, date, details);

            await sendNotification(roomNumber, date, details);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Réservation réussie.' }),
            };
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'La salle de conférence n\'est pas disponible pour cette date.' }),
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Erreur lors de la réservation.' }),
        };
    }
};

export async function checkAvailability(roomNumber, date) {
    // Vérification de la disponibilité
    try {
        const db = client.db('conference');
        const collection = db.collection('reservations');

        const query = { roomNumber: roomNumber, date: date };
        const reservation = await collection.findOne(query);

        // Si la réservation existe, la salle n'est pas disponible
        return !reservation;
    } catch (error) {
        console.error('Error checking availability:', error);
        throw new Error('Erreur lors de la vérification de la disponibilité.');
    }
}

export async function createReservation(roomNumber, date, details) {
    // Enregistre la réservation
    try {
        const db = client.db('conference');
        const collection = db.collection('reservations');

        // Créer la réservation
        const reservation = {
            roomNumber: roomNumber,
            date: date,
            details: details
        };

        // Ajoute la réservation dans la base de données
        await collection.insertOne(reservation);

        console.log('Reservation created:', reservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        throw new Error('Erreur lors de l\'enregistrement de la réservation.');
    }
}

export async function sendNotification(roomNumber, date, details) {
    // Envoie une notification par mail
    mg.messages
        .create("sandbox467e602e6782426b9b03cfbbe46dd44a.mailgun.org", {
            from: "Mailgun Sandbox <postmaster@sandbox467e602e6782426b9b03cfbbe46dd44a.mailgun.org>",
            to: ["lois.morvan@laposte.net"],
            subject: 'Réservation accepté',
            text: `La réservation de la salle ${roomNumber} le ${date} à été accepté.\n Détail : ${details}`,
        })
        .then(msg => console.log(msg))
        .catch(err => console.log(err));
}
