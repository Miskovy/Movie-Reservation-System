import type { Request, Response } from 'express';
import { ShowtimeModel } from '../models/Showtime';
import { MovieModel } from '../models/Movie';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../utils/types';

export class ShowtimeController {

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { movie_id, start_time, end_time, price, total_seats } = req.body;

            // Check if movie exists
            const movie = await MovieModel.findById(movie_id);
            if (!movie) {
                res.status(404).json({ message: 'Movie not found' });
                return;
            }

            const showtime = await ShowtimeModel.create(
                movie_id,
                new Date(start_time),
                new Date(end_time),
                price,
                total_seats,
                total_seats
            );

            res.status(201).json({
                message: 'Showtime created successfully',
                showtime,
            });

        } catch (error: any) {
            console.error('Create showtime error:', error);
            if (error.message === 'Showtime overlaps with existing showtime') {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const showtime = await ShowtimeModel.findById(parseInt(id));

            if (!showtime) {
                res.status(404).json({ message: 'Showtime not found' });
                return;
            }

            res.json(showtime);
        } catch (error) {
            console.error('Get showtime by id error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getByMovieId(req: Request, res: Response): Promise<void> {
        try {
            const { movieId } = req.params;
            const showtimes = await ShowtimeModel.findByMovieId(parseInt(movieId));
            res.json(showtimes);
        } catch (error) {
            console.error('Get showtimes by movie id error:', error);
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

            const showtime = await ShowtimeModel.update(parseInt(id), updates);
            if (!showtime) {
                res.status(404).json({ message: 'Showtime not found' });
                return;
            }

            res.json({
                message: 'Showtime updated successfully',
                showtime,
            });

        } catch (error) {
            console.error('Update showtime error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const deleted = await ShowtimeModel.delete(parseInt(id));
            if (!deleted) {
                res.status(404).json({ message: 'Showtime not found' });
                return;
            }

            res.json({ message: 'Showtime deleted successfully' });

        } catch (error) {
            console.error('Delete showtime error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAvailableSeats(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const showtime = await ShowtimeModel.findById(parseInt(id));
            if (!showtime) {
                res.status(404).json({ message: 'Showtime not found' });
                return;
            }

            const seats = await ShowtimeModel.getAvailableSeats(parseInt(id));
            res.json({
                showtime,
                seats,
            });

        } catch (error) {
            console.error('Get available seats error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
