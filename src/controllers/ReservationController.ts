import type { Response } from 'express';
import { ReservationModel } from '../models/Reservation';
import { ShowtimeModel } from '../models/Showtime';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../utils/types';

export class ReservationController {

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { showtime_id, seat_ids } = req.body;
            const user_id = req.user!.id;

            // Check if showtime exists
            const showtime = await ShowtimeModel.findById(showtime_id);
            if (!showtime) {
                res.status(404).json({ message: 'Showtime not found' });
                return;
            }

            // Check if showtime is in the future
            if (new Date(showtime.startTime) < new Date()) {
                res.status(400).json({ message: 'Cannot book past showtimes' });
                return;
            }

            const reservation = await ReservationModel.create(user_id, showtime_id, seat_ids);

            res.status(201).json({
                message: 'Reservation created successfully',
                reservation,
            });

        } catch (error: any) {
            console.error('Create reservation error:', error);
            if (error.message.includes('seats')) {
                res.status(400).json({ message: error.message });
                return;
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getMyReservations(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user_id = req.user!.id;
            const reservations = await ReservationModel.findByUserId(user_id);
            res.json(reservations);
        } catch (error) {
            console.error('Get my reservations error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const reservation = await ReservationModel.findById(parseInt(id));

            if (!reservation) {
                res.status(404).json({ message: 'Reservation not found' });
                return;
            }

            // Users can only view their own reservations, admins can view all
            if (reservation.userId !== req.user!.id && req.user!.role !== 'admin') {
                res.status(403).json({ message: 'Access denied' });
                return;
            }

            res.json(reservation);
        } catch (error) {
            console.error('Get reservation by id error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async cancel(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const user_id = req.user!.id;

            const cancelled = await ReservationModel.cancel(parseInt(id), user_id);
            if (!cancelled) {
                res.status(404).json({ message: 'Reservation not found or already cancelled' });
                return;
            }

            res.json({ message: 'Reservation cancelled successfully' });

        } catch (error) {
            console.error('Cancel reservation error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Admin only
    static async getAllReservations(req: AuthRequest, res: Response): Promise<void> {
        try {
            const reservations = await ReservationModel.getAllReservations();
            res.json(reservations);
        } catch (error) {
            console.error('Get all reservations error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Admin only
    static async getReportStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const stats = await ReservationModel.getReportStats();
            res.json(stats);
        } catch (error) {
            console.error('Get report stats error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
