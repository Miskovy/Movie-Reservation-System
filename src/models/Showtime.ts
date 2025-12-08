import pool from "../config/database";
import { Showtime } from "../utils/types";

export class ShowtimeModel {
    static async create(
        movie_id: number,
        start_time: Date,
        end_time: Date,
        price: number,
        available_seats: number,
        total_seats: number
    ): Promise<Showtime> {
        const result = await pool.query(
            `INSERT INTO showtimes (movie_id, start_time, end_time, price, available_seats, total_seats) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [movie_id, start_time, end_time, price, available_seats, total_seats]
        );
        return result.rows[0];
    }

}