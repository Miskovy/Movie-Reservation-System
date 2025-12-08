import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error : ', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation Error', details: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized Error', details: 'Unauthorized' });
    }

    return res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === 'development' ? err.message : 'Something Went Wrong' });
};