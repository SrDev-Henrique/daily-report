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

export const checklistStatus = ["ok", "pendente", "não feito"] as const;

export const checklistStatusEnum = pgEnum("checklist_status", checklistStatus);

export type Checklist = {
  limpeza: {
    salao: "ok" | "pendente" | "não feito";
    banheiro_masculino: "ok" | "pendente" | "não feito";
    banheiro_hc_masculino: "ok" | "pendente" | "não feito";
    banheiro_feminino: "ok" | "pendente" | "não feito";
    banheiro_hc_feminino: "ok" | "pendente" | "não feito";
    copa: "ok" | "pendente" | "não feito";
    area_servico: "ok" | "pendente" | "não feito";
    area_cozinha: "ok" | "pendente" | "não feito";
    area_bar: "ok" | "pendente" | "não feito";
  };
  buffet: "ok" | "pendente" | "não feito";
  geladeira: "ok" | "pendente" | "não feito";
};

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  time: timestamp("time", { withTimezone: true }).notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: checklistStatusEnum("status").notNull(),
  checklist: json("checklist").$type<Checklist>().notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Round = InferSelectModel<typeof rounds>;
export type NewRound = InferInsertModel<typeof rounds>;
