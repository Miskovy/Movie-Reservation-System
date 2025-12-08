import type { Request } from 'express';

export interface User {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'user' | 'admin';
    created_at: Date;
    updated_at: Date;
}

export interface Movie {
    id: number;
    title: string;
    description: string;
    poster_image: string;
    genre: string;
    duration: number;
    release_date: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Showtime {
    id: number;
    movie_id: number;
    start_time: Date;
    end_time: Date;
    price: number;
    total_seats: number;
    available_seats: number;
    created_at: Date;
    updated_at: Date;
}

export interface Seat {
    id: number;
    showtime_id: number;
    seat_number: string;
    row_number: string;
    is_reserved: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Reservation {
    id: number;
    user_id: number;
    showtime_id: number;
    total_price: number;
    status: 'confirmed' | 'cancelled';
    created_at: Date;
    updated_at: Date;
}

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: 'user' | 'admin';
    };
}

export interface JWTPayload {
    id: number;
    email: string;
    role: 'user' | 'admin';
}