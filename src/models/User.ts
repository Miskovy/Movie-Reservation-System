import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { User } from '../utils/types';

export class UserModel {


    static async create(email: string, password: string, name: string, role: 'user' | 'admin' = 'user'): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email,password,name,role) VALUES ($1,$2,$3,$4) RETURNING *',
            [email, hashedPassword, name, role]
        );

        return result.rows[0];
    }


    static async findByEmail(email: string): Promise<User | null> {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    static async findById(id: number): Promise<User | null> {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async updateRole(userId: number, role: 'user' | 'admin'): Promise<User> {
        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [role, userId]
        );
        return result.rows[0];
    }

    static async getAllUsers(): Promise<User[]> {
        const result = await pool.query('SELECT id,email,name,role,created_at FROM users ORDER BY created_at DESC');
        return result.rows;
    }



}
