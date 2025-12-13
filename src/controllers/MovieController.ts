import type { Request, Response } from 'express';
import { MovieModel } from '../models/Movie';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../utils/types';

export class MovieController {

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { title, description, poster_image, genre, duration, release_date } = req.body;

            const movie = await MovieModel.create(
                title,
                description,
                poster_image,
                genre,
                duration,
                new Date(release_date)
            );

            res.status(201).json({
                message: 'Movie created successfully',
                movie,
            });

        } catch (error) {
            console.error('Create movie error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAll(req: Request, res: Response): Promise<void> {
        try {
            const { genre } = req.query;
            const movies = await MovieModel.findAll(genre as string | undefined);
            res.json(movies);
        } catch (error) {
            console.error('Get all movies error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const movie = await MovieModel.findById(parseInt(id));

            if (!movie) {
                res.status(404).json({ message: 'Movie not found' });
                return;
            }

            res.json(movie);
        } catch (error) {
            console.error('Get movie by id error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const updates = req.body;

            // Check if movie exists
            const existingMovie = await MovieModel.findById(parseInt(id));
            if (!existingMovie) {
                res.status(404).json({ message: 'Movie not found' });
                return;
            }

            const movie = await MovieModel.update(parseInt(id), updates);

            res.json({
                message: 'Movie updated successfully',
                movie,
            });

        } catch (error) {
            console.error('Update movie error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const deleted = await MovieModel.delete(parseInt(id));
            if (!deleted) {
                res.status(404).json({ message: 'Movie not found' });
                return;
            }

            res.json({ message: 'Movie deleted successfully' });

        } catch (error) {
            console.error('Delete movie error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getMoviesWithShowtimes(req: Request, res: Response): Promise<void> {
        try {
            const { date } = req.query;
            const movies = await MovieModel.getMoviesWithShowtimes(date as string | undefined);
            res.json(movies);
        } catch (error) {
            console.error('Get movies with showtimes error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
