// src/drizzle/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/data/env/server";
import type * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool);

export type DB = typeof schema;
