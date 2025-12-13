import { db, pool } from "../config/database";
import { showtimes, seats } from "../database/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import type { Showtime } from "../database/schema";

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

            // Check for overlap
            const overlap = await client.query(
                `SELECT id FROM showtimes
                WHERE movie_id = $1
                AND ((start_time BETWEEN $2 AND $3) OR (end_time BETWEEN $2 AND $3) OR ($2 BETWEEN start_time AND end_time))`,
                [movie_id, start_time, end_time]
            );

            if (overlap.rows.length > 0) {
                throw new Error('Showtime overlaps with existing showtime');
            }

            // Create Showtime using Drizzle
            const [showtime] = await db.insert(showtimes)
                .values({
                    movieId: movie_id,
                    startTime: start_time,
                    endTime: end_time,
                    price: price.toString(),
                    totalSeats: total_seats,
                    availableSeats: total_seats,
                })
                .returning();

            // Generate seats
            const seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            const seatsPerRow = 10;
            const seatsToInsert: { showtimeId: number; seatNumber: string; rowNumber: string }[] = [];

            for (let i = 0; i < seatRows.length && seatsToInsert.length < total_seats; i++) {
                for (let j = 1; j <= seatsPerRow && seatsToInsert.length < total_seats; j++) {
                    seatsToInsert.push({
                        showtimeId: showtime.id,
                        seatNumber: `${seatRows[i]}${j}`,
                        rowNumber: seatRows[i],
                    });
                }
            }

            if (seatsToInsert.length > 0) {
                await db.insert(seats).values(seatsToInsert);
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
        const [showtime] = await db.select()
            .from(showtimes)
            .where(eq(showtimes.id, id));
        return showtime || null;
    }

    static async findByMovieId(movie_id: number): Promise<Showtime[]> {
        return await db.select()
            .from(showtimes)
            .where(and(
                eq(showtimes.movieId, movie_id),
                gte(showtimes.startTime, new Date())
            ))
            .orderBy(showtimes.startTime);
    }

    static async update(id: number, updates: Partial<Omit<Showtime, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Showtime | null> {
        const updateData: Record<string, any> = { updatedAt: new Date() };

        if (updates.movieId) updateData.movieId = updates.movieId;
        if (updates.startTime) updateData.startTime = updates.startTime;
        if (updates.endTime) updateData.endTime = updates.endTime;
        if (updates.price) updateData.price = updates.price;
        if (updates.totalSeats) updateData.totalSeats = updates.totalSeats;
        if (updates.availableSeats) updateData.availableSeats = updates.availableSeats;

        const [showtime] = await db.update(showtimes)
            .set(updateData)
            .where(eq(showtimes.id, id))
            .returning();
        return showtime || null;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.delete(showtimes)
            .where(eq(showtimes.id, id))
            .returning({ id: showtimes.id });
        return result.length > 0;
    }

    static async getAvailableSeats(showtime_id: number): Promise<any[]> {
        return await db.select({
            id: seats.id,
            seatNumber: seats.seatNumber,
            rowNumber: seats.rowNumber,
            isReserved: seats.isReserved,
        })
            .from(seats)
            .where(eq(seats.showtimeId, showtime_id))
            .orderBy(seats.rowNumber, seats.seatNumber);
    }
}