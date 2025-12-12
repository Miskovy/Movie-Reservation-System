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
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const overlap = await client.query(
                `SELECT id FROM showtimes
                WHERE movie_id = $1
                AND ((start_time BETWEEN $2 AND $3) OR (end_time BETWEEN $2 AND $3) OR ($2 BETWEEN start_time AND end_time))`,
                [movie_id, start_time, end_time]
            );
            if (overlap.rows.length > 0) {
                throw new Error('Showtime overlaps with existing showtime');
            }
            // Create Showtime
            const showtimeResult = await client.query(
                `INSERT INTO showtimes (movie_id, start_time, end_time, price, total_seats, available_seats) VALUES ($1 , $2 ,$3 , $4 , $5 , $5) RETURNING`,
                [movie_id, start_time, end_time, price, total_seats]
            );
            const showtime = showtimeResult.rows[0];
            // Generate seats for it
            const seats = [];
            const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            const seatsPerRow = 10;

            for (let i = 0; i < rows.length && seats.length < total_seats; i++) {
                for (let j = 1; j <= seatsPerRow && seats.length < total_seats; j++) {
                    seats.push(`('${showtime.id}', '${rows[i]}${j}', '${rows[i]}')`);
                }
            }
            if (seats.length > 0) {
                await client.query(`INSERT INTO seats (showtime_id , seat_number, row_number) VALUES ${seats.join(',')}`);
            }
            await client.query('COMMIT');
            return showtime;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findById(id: number): Promise<Showtime | null> {
        const client = await pool.query('SELECT * FROM showtimes WHERE id = $1', [id]);
        return client.rows[0];
    }

    static async findByMovieId(movie_id: number): Promise<Showtime[] | null> {
        const result = await pool.query('SELECT FROM showtimes WHERE movie_id = $1 AND start_time >= CURRENT_TIMESTAMP ORDER BY start_time',
            [movie_id]
        );
        return result.rows;
    }

    static async update(id: number, updates: Partial<Omit<Showtime, 'id' | 'created_at' | 'updated_at'>>): Promise<Showtime | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;
        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });
        values.push(id);
        const result = await pool.query(`UPDATE showtimes set ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`, values);
        return result.rows[0];
    }


    static async delete(id: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM showtimes WHERE id = $1', [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }

    static async getAvailableSeats(showtime_id: number): Promise<any[]> {
        const result = await pool.query(`SELECT id , seat_number , row_number , is_reserved
            FROM seats
            WHERE showtime_id = $1
            ORDER BY row_number , seat_number` , [showtime_id]);
        return result.rows;
    }
}