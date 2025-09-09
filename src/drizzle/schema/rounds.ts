// src/drizzle/schema/rounds.ts
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  integer,
  json,
  pgTable,
  pgEnum,
  serial,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import type { Checklist } from "@/lib/schema/types";

export const checklistStatus = ["ok", "pendente", "não feito"] as const;

export const checklistStatusEnum = pgEnum("checklist_status", checklistStatus);

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: checklistStatusEnum("status").notNull(),
  checklist: json("checklist").$type<Checklist>().notNull(),
  notes: text("notes"),
});

export type Round = InferSelectModel<typeof rounds>;
export type NewRound = InferInsertModel<typeof rounds>;
