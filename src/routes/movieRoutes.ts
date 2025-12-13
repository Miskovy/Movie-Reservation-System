import { Router } from 'express';
import { MovieController } from '../controllers/MovieController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const movieValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
];

// Public routes
router.get('/', MovieController.getAll);
router.get('/showtimes', MovieController.getMoviesWithShowtimes);
router.get('/:id', MovieController.getById);

// Admin routes
router.post('/', authenticate, authorizeAdmin, movieValidation, MovieController.create);
router.put('/:id', authenticate, authorizeAdmin, MovieController.update);
router.delete('/:id', authenticate, authorizeAdmin, MovieController.delete);

export default router;
