import type { Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import type { AuthRequest, JWTPayload } from "../utils/types";

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized Access Admin' });
    }
    next();
};