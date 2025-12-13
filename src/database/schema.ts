import { pgTable, serial, varchar, text, integer, decimal, boolean, timestamp, date, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).default('user').notNull().$type<'user' | 'admin'>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Movies Table
export const movies = pgTable('movies', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    posterImage: varchar('poster_image', { length: 500 }),
    genre: varchar('genre', { length: 100 }),
    duration: integer('duration').notNull(), // in minutes
    releaseDate: date('release_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Showtimes Table
export const showtimes = pgTable('showtimes', {
    id: serial('id').primaryKey(),
    movieId: integer('movie_id').notNull().references(() => movies.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    totalSeats: integer('total_seats').notNull().default(100),
    availableSeats: integer('available_seats').notNull().default(100),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Seats Table
export const seats = pgTable('seats', {
    id: serial('id').primaryKey(),
    showtimeId: integer('showtime_id').notNull().references(() => showtimes.id, { onDelete: 'cascade' }),
    seatNumber: varchar('seat_number', { length: 10 }).notNull(),
    rowNumber: varchar('row_number', { length: 5 }).notNull(),
    isReserved: boolean('is_reserved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    uniqueSeat: unique().on(table.showtimeId, table.seatNumber),
}));

// Reservations Table
export const reservations = pgTable('reservations', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    showtimeId: integer('showtime_id').notNull().references(() => showtimes.id, { onDelete: 'cascade' }),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('confirmed').notNull().$type<'confirmed' | 'cancelled'>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Reservation Seats (many-to-many)
export const reservationSeats = pgTable('reservation_seats', {
    id: serial('id').primaryKey(),
    reservationId: integer('reservation_id').notNull().references(() => reservations.id, { onDelete: 'cascade' }),
    seatId: integer('seat_id').notNull().references(() => seats.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    uniqueReservationSeat: unique().on(table.reservationId, table.seatId),
}));

// ===== RELATIONS =====

export const usersRelations = relations(users, ({ many }) => ({
    reservations: many(reservations),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
    showtimes: many(showtimes),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
    movie: one(movies, {
        fields: [showtimes.movieId],
        references: [movies.id],
    }),
    seats: many(seats),
    reservations: many(reservations),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
    showtime: one(showtimes, {
        fields: [seats.showtimeId],
        references: [showtimes.id],
    }),
    reservationSeats: many(reservationSeats),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
    user: one(users, {
        fields: [reservations.userId],
        references: [users.id],
    }),
    showtime: one(showtimes, {
        fields: [reservations.showtimeId],
        references: [showtimes.id],
    }),
    reservationSeats: many(reservationSeats),
}));

export const reservationSeatsRelations = relations(reservationSeats, ({ one }) => ({
    reservation: one(reservations, {
        fields: [reservationSeats.reservationId],
        references: [reservations.id],
    }),
    seat: one(seats, {
        fields: [reservationSeats.seatId],
        references: [seats.id],
    }),
}));

// Type exports for inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type Showtime = typeof showtimes.$inferSelect;
export type NewShowtime = typeof showtimes.$inferInsert;
export type Seat = typeof seats.$inferSelect;
export type NewSeat = typeof seats.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type ReservationSeat = typeof reservationSeats.$inferSelect;
export type NewReservationSeat = typeof reservationSeats.$inferInsert;
