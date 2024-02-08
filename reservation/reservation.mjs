import { MongoClient, ServerApiVersion } from "mongodb";
import mailgun from 'mailgun.js';
import FormData from 'form-data';
import { reservationSchema } from './validation/reservationSchema.mjs';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;
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
    key: process.env.MAILGUN_PRIVATE_KEY,
});

export const handler = async (event) => {
    try {
        const reservationData = JSON.parse(event.body);
        const result = reservationSchema.safeParse(reservationData);

        if (!result.success) {
            return {
                statusCode: 400,
                body: JSON.stringify(result.error),
            };
        }

        const { roomNumber, date, details } = result.data;

        const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
        const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);

        const isAvailable = await checkAvailability(roomNumber, formattedDate);

        if (isAvailable) {
            await createReservation(roomNumber, formattedDate, details);

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
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(date);
    // Envoie une notification par mail
    mg.messages
        .create("sandbox467e602e6782426b9b03cfbbe46dd44a.mailgun.org", {
            from: "Mailgun Sandbox <postmaster@sandbox467e602e6782426b9b03cfbbe46dd44a.mailgun.org>",
            to: [process.env.MAILGUN_EMAIL],
            subject: 'Réservation accepté',
            text: `La réservation de la salle ${roomNumber} le ${formattedDate} à été accepté.\n Détail : ${details}`,
        })
        .then(msg => console.log(msg))
        .catch(err => console.log(err));
}
