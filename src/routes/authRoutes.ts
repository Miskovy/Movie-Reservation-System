import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Public routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

// Admin routes
router.get('/users', authenticate, authorizeAdmin, AuthController.getAllUsers);
router.patch('/users/:userId/role', authenticate, authorizeAdmin, AuthController.updateUserRole);

export default router;
