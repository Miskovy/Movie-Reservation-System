import { db } from "../config/database";
import { movies, showtimes } from "../database/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { Movie } from "../database/schema";

export class MovieModel {

    static async create(
        title: string,
        description: string,
        poster_image: string,
        genre: string,
        duration: number,
        release_date: Date
    ): Promise<Movie> {
        const [movie] = await db.insert(movies)
            .values({
                title,
                description,
                posterImage: poster_image,
                genre,
                duration,
                releaseDate: release_date.toISOString().split('T')[0],
            })
            .returning();
        return movie;
    }

    static async findById(id: number): Promise<Movie | null> {
        const [movie] = await db.select()
            .from(movies)
            .where(eq(movies.id, id));
        return movie || null;
    }

    static async findAll(genre?: string): Promise<Movie[]> {
        if (genre) {
            return await db.select()
                .from(movies)
                .where(eq(movies.genre, genre))
                .orderBy(desc(movies.releaseDate));
        }
        return await db.select()
            .from(movies)
            .orderBy(desc(movies.releaseDate));
    }

    static async update(id: number, updates: Partial<Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Movie> {
        const updateData: Record<string, any> = { updatedAt: new Date() };

        if (updates.title) updateData.title = updates.title;
        if (updates.description) updateData.description = updates.description;
        if (updates.posterImage) updateData.posterImage = updates.posterImage;
        if (updates.genre) updateData.genre = updates.genre;
        if (updates.duration) updateData.duration = updates.duration;
        if (updates.releaseDate) updateData.releaseDate = updates.releaseDate;

        const [movie] = await db.update(movies)
            .set(updateData)
            .where(eq(movies.id, id))
            .returning();
        return movie;
    }

    static async delete(id: number): Promise<boolean> {
        const result = await db.delete(movies)
            .where(eq(movies.id, id))
            .returning({ id: movies.id });
        return result.length > 0;
    }

    static async getMoviesWithShowtimes(date?: string): Promise<any[]> {
        // Using raw SQL for complex aggregation query
        const query = date
            ? sql`
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
                WHERE DATE(s.start_time) = ${date}
                GROUP BY m.id 
                ORDER BY m.title
            `
            : sql`
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
                WHERE s.start_time >= CURRENT_TIMESTAMP
                GROUP BY m.id 
                ORDER BY m.title
            `;

        const result = await db.execute(query);
        return result.rows as any[];
    }
}