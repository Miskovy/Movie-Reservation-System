import { db, pool } from "../config/database";
import { reservations, reservationSeats, seats, showtimes, users, movies } from "../database/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import type { Reservation } from "../database/schema";

export class ReservationModel {
    static async create(
        user_id: number,
        showtime_id: number,
        seat_ids: number[]
    ): Promise<Reservation> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lock showtime row
            await client.query('SELECT * FROM showtimes WHERE id = $1 FOR UPDATE', [showtime_id]);

            // Lock and check seats
            const seatCheck = await client.query(
                `SELECT id, is_reserved FROM seats
                WHERE id = ANY($1) AND showtime_id = $2 FOR UPDATE`,
                [seat_ids, showtime_id]
            );

            if (seatCheck.rows.length !== seat_ids.length) {
                throw new Error('Some seats do not exist for this showtime');
            }

            const alreadyReserved = seatCheck.rows.filter(s => s.is_reserved);
            if (alreadyReserved.length > 0) {
                throw new Error('Some seats are already reserved');
            }

            // Get showtime price
            const [showtime] = await db.select({ price: showtimes.price })
                .from(showtimes)
                .where(eq(showtimes.id, showtime_id));

            const totalPrice = parseFloat(showtime.price) * seat_ids.length;

            // Create reservation
            const [reservation] = await db.insert(reservations)
                .values({
                    userId: user_id,
                    showtimeId: showtime_id,
                    totalPrice: totalPrice.toString(),
                    status: 'confirmed',
                })
                .returning();

            // Link seats to reservation
            const reservationSeatValues = seat_ids.map(seat_id => ({
                reservationId: reservation.id,
                seatId: seat_id,
            }));
            await db.insert(reservationSeats).values(reservationSeatValues);

            // Mark seats as reserved
            await db.update(seats)
                .set({ isReserved: true, updatedAt: new Date() })
                .where(inArray(seats.id, seat_ids));

            // Update available seats count
            await db.update(showtimes)
                .set({
                    availableSeats: sql`${showtimes.availableSeats} - ${seat_ids.length}`,
                    updatedAt: new Date(),
                })
                .where(eq(showtimes.id, showtime_id));

            await client.query('COMMIT');
            return reservation;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async findById(id: number): Promise<Reservation | null> {
        const [reservation] = await db.select()
            .from(reservations)
            .where(eq(reservations.id, id));
        return reservation || null;
    }

    static async findByUserId(user_id: number): Promise<any[]> {
        const result = await db.select({
            id: reservations.id,
            totalPrice: reservations.totalPrice,
            status: reservations.status,
            createdAt: reservations.createdAt,
            showtime: {
                id: showtimes.id,
                startTime: showtimes.startTime,
                endTime: showtimes.endTime,
            },
            movie: {
                id: movies.id,
                title: movies.title,
            },
        })
            .from(reservations)
            .leftJoin(showtimes, eq(reservations.showtimeId, showtimes.id))
            .leftJoin(movies, eq(showtimes.movieId, movies.id))
            .where(eq(reservations.userId, user_id))
            .orderBy(desc(reservations.createdAt));
        return result;
    }

    static async cancel(id: number, user_id: number): Promise<boolean> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get reservation with seats
            const [reservation] = await db.select()
                .from(reservations)
                .where(and(
                    eq(reservations.id, id),
                    eq(reservations.userId, user_id),
                    eq(reservations.status, 'confirmed')
                ));

            if (!reservation) {
                return false;
            }

            // Get seat IDs from reservation
            const seatLinks = await db.select({ seatId: reservationSeats.seatId })
                .from(reservationSeats)
                .where(eq(reservationSeats.reservationId, id));

            const seatIds = seatLinks.map(s => s.seatId);

            // Mark seats as unreserved
            if (seatIds.length > 0) {
                await db.update(seats)
                    .set({ isReserved: false, updatedAt: new Date() })
                    .where(inArray(seats.id, seatIds));
            }

            // Update available seats count
            await db.update(showtimes)
                .set({
                    availableSeats: sql`${showtimes.availableSeats} + ${seatIds.length}`,
                    updatedAt: new Date(),
                })
                .where(eq(showtimes.id, reservation.showtimeId));

            // Update reservation status
            await db.update(reservations)
                .set({ status: 'cancelled', updatedAt: new Date() })
                .where(eq(reservations.id, id));

            await client.query('COMMIT');
            return true;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async getAllReservations(): Promise<any[]> {
        return await db.select({
            id: reservations.id,
            totalPrice: reservations.totalPrice,
            status: reservations.status,
            createdAt: reservations.createdAt,
            user: {
                id: users.id,
                name: users.name,
                email: users.email,
            },
            showtime: {
                id: showtimes.id,
                startTime: showtimes.startTime,
            },
            movie: {
                id: movies.id,
                title: movies.title,
            },
        })
            .from(reservations)
            .leftJoin(users, eq(reservations.userId, users.id))
            .leftJoin(showtimes, eq(reservations.showtimeId, showtimes.id))
            .leftJoin(movies, eq(showtimes.movieId, movies.id))
            .orderBy(desc(reservations.createdAt));
    }

    static async getReportStats(): Promise<any> {
        const stats = await db.execute(sql`
            SELECT 
                COUNT(*) as total_reservations,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END), 0) as total_revenue
            FROM reservations
        `);
        return stats.rows[0];
    }
}