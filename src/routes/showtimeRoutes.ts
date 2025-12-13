import { Router } from 'express';
import { ShowtimeController } from '../controllers/ShowtimeController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const showtimeValidation = [
    body('movie_id').isInt({ min: 1 }).withMessage('Movie ID is required'),
    body('start_time').isISO8601().withMessage('Start time must be a valid date'),
    body('end_time').isISO8601().withMessage('End time must be a valid date'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('total_seats').isInt({ min: 1 }).withMessage('Total seats must be a positive integer'),
];

// Public routes
router.get('/:id', ShowtimeController.getById);
router.get('/movie/:movieId', ShowtimeController.getByMovieId);
router.get('/:id/seats', ShowtimeController.getAvailableSeats);

// Admin routes
router.post('/', authenticate, authorizeAdmin, showtimeValidation, ShowtimeController.create);
router.put('/:id', authenticate, authorizeAdmin, ShowtimeController.update);
router.delete('/:id', authenticate, authorizeAdmin, ShowtimeController.delete);

export default router;
