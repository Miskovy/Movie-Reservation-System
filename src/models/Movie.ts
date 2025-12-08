import pool from "../config/database";
import { Movie } from "../utils/types";


export class MovieModel {

    static async create(
        title: string,
        description: string,
        poster_image: string,
        genre: string,
        duration: number,
        release_date: Date
    ): Promise<Movie> {
        const result = await pool.query(
            `INSERT INTO movies (title, description, poster_image, genre, duration, release_date) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description, poster_image, genre, duration, release_date]
        );
        return result.rows[0];
    }

    static async findById(id: number): Promise<Movie | null> {
        const result = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async findAll(genre?: string): Promise<Movie[]> {
        let query = 'SELECT * FROM movies';
        const params: any[] = [];

        if (genre) {
            query += ' WHERE genre = $1';
            params.push(genre);
        }

        query += ' ORDER BY release_date DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async update(id: number, updates: Partial<Omit<Movie, 'id' | 'created_at' | 'updated_at'>>): Promise<Movie> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;
        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });
        values.push(id);
        const result = await pool.query(
            `UPDATE movies SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    static async delete(id: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM movies WHERE id = $1', [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }

    static async getMoviesWithShowtimes(date?: string): Promise<any[]> {
        let query = `
        SELECT 
            m.*,
            json_agg(
                json_build_object(
                    'id', s.id,
                    'start_time', s.start_time,
                    'end_time', s.end_time,
                    'price', s.price,
                    'available_seats', s.available_seats,
                    'total_seats', s.total_seats
                ) ORDER BY s.start_time
            ) FILTER (WHERE s.id IS NOT NULL) as showtimes
        FROM movies m
        LEFT JOIN showtimes s ON m.id = s.movie_id
    `;

        const params: any[] = [];

        if (date) {
            query += ` WHERE DATE(s.start_time) = $1`;
            params.push(date);
        } else {
            query += ` WHERE s.start_time >= CURRENT_TIMESTAMP`;
        }

        query += ` GROUP BY m.id ORDER BY m.title`;

        const result = await pool.query(query, params);
        return result.rows;
    }

}