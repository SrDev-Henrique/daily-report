// src/drizzle/schema/issues.ts
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { rounds } from "./rounds";

export const category = ["técnico", "atendimento", "limpeza", "buffet", "outro"] as const;
export const categoryEnum = pgEnum("category", category);

export const severity = ["baixa", "media", "alta", "urgente"] as const;
export const severityEnum = pgEnum("severity", severity);

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  round_id: integer("round_id")
    .references(() => rounds.id)
    .notNull(),
  category: categoryEnum("category").notNull(),
  severity: severityEnum("severity").notNull().default("baixa"),
  description: text("description").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Issue = InferSelectModel<typeof issues>;
export type NewIssue = InferInsertModel<typeof issues>;
