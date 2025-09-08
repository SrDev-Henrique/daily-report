// src/drizzle/schema/user.ts
import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 200 }).notNull(),
  password_hash: varchar("password_hash", { length: 200 }).notNull(),
  role: varchar("role", { length: 40 }).notNull().default("operator"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
