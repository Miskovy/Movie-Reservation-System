import { db } from '../config/database';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User } from '../database/schema';

export class UserModel {

    static async create(email: string, password: string, name: string, role: 'user' | 'admin' = 'user'): Promise<User> {
        const hashedPassword = await bcrypt.hash(password, 10);

        const [user] = await db.insert(users)
            .values({
                email,
                password: hashedPassword,
                name,
                role,
            })
            .returning();

        return user;
    }

    static async findByEmail(email: string): Promise<User | null> {
        const [user] = await db.select()
            .from(users)
            .where(eq(users.email, email));
        return user || null;
    }

    static async findById(id: number): Promise<User | null> {
        const [user] = await db.select()
            .from(users)
            .where(eq(users.id, id));
        return user || null;
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async updateRole(userId: number, role: 'user' | 'admin'): Promise<User> {
        const [user] = await db.update(users)
            .set({ role, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning();
        return user;
    }

    static async getAllUsers(): Promise<Omit<User, 'password'>[]> {
        const result = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        })
            .from(users)
            .orderBy(users.createdAt);
        return result;
    }
}
