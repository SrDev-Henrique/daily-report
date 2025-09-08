// src/drizzle/schema/issues.ts
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { rounds } from "./rounds";

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  round_id: integer("round_id")
    .references(() => rounds.id)
    .notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("low"),
  description: text("description").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Issue = InferSelectModel<typeof issues>;
export type NewIssue = InferInsertModel<typeof issues>;
