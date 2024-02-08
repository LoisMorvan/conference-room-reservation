import { object, string, coerce, number } from 'zod';

const MIN_ROOM_NUMBER = 1;
const MAX_ROOM_NUMBER = 300;

export const reservationSchema = object({
    roomNumber: number().int().min(MIN_ROOM_NUMBER, { message: 'Room number must be between 1 and 300' }).max(MAX_ROOM_NUMBER, { message: 'Room number must be between 1 and 300' }),
    date: coerce.date().min(new Date(), { message: 'Reservation date must be today or in the future' }),
    details: string(),
});
