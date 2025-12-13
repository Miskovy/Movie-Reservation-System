import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const reservationValidation = [
    body('showtime_id').isInt({ min: 1 }).withMessage('Showtime ID is required'),
    body('seat_ids').isArray({ min: 1 }).withMessage('At least one seat must be selected'),
    body('seat_ids.*').isInt({ min: 1 }).withMessage('Invalid seat ID'),
];

// Protected routes (requires login)
router.post('/', authenticate, reservationValidation, ReservationController.create);
router.get('/my', authenticate, ReservationController.getMyReservations);
router.get('/:id', authenticate, ReservationController.getById);
router.post('/:id/cancel', authenticate, ReservationController.cancel);

// Admin routes
router.get('/', authenticate, authorizeAdmin, ReservationController.getAllReservations);
router.get('/report/stats', authenticate, authorizeAdmin, ReservationController.getReportStats);

export default router;
