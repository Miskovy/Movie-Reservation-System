import type { Request, Response } from 'express';
import { UserModel } from '../models/User';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import type { AuthRequest } from '../utils/types';

export class AuthController {

    static async register(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, name } = req.body;

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                res.status(400).json({ message: 'User already exists with this email' });
                return;
            }

            // Create new user
            const user = await UserModel.create(email, password, name);

            // Generate token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Find user
            const user = await UserModel.findByEmail(email);
            if (!user) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            // Verify password
            const isPasswordValid = await UserModel.comparePassword(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({ message: 'Invalid email or password' });
                return;
            }

            // Generate token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET!,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                token,
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getProfile(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user = await UserModel.findById(req.user!.id);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt,
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const users = await UserModel.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    static async updateUserRole(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            if (!['user', 'admin'].includes(role)) {
                res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
                return;
            }

            const user = await UserModel.updateRole(parseInt(userId), role);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json({
                message: 'User role updated successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            });

        } catch (error) {
            console.error('Update user role error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
