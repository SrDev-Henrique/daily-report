// src/drizzle/schema/issues.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  date,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./user";
import { rounds } from "./rounds";

export const type = ["reclamação", "elogio"] as const;

export const typeEnum = pgEnum("type", type);

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  round_id: integer("round_id")
    .references(() => rounds.id)
    .notNull(),
  date: date("date").notNull(),
  type: typeEnum("type").notNull(),
  text: text("text").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Feedback = InferSelectModel<typeof feedback>;
export type NewFeedback = InferInsertModel<typeof feedback>;
