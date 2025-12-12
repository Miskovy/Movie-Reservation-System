import { pool } from "../config/database";
import { Reservation } from "../utils/types";
export class ReservationModel {
    static async create(
        user_id: number,
        showtime_id: number,
        seat_ids: numebr[]
    ): Promise<Reservation> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT * FROM showtimes WHERE id = $1 FOR UPDATE', [showtime_id]);
            const seatCheck = await client.query(`
                SELECT id , is_reserved FROM seats
                WHERE id = ANY($1) AND showtime_id = $2 FOR UPDATE
                `, [seat_ids, showtime_id]);

        } catch (err) {

        }



    }







    static async findById(id: number): Promise<Reservation | null> {

    }
    static async findByUserId(user_id: number): Promise<Reservation[]> {

    }
    static async cancel(id: number, user_id: number): Promise<boolean> {

    }
    static async getAllReservations(): Promise<any[]> {

    }
    static async getReportStats(): Promise<any> {

    }
}