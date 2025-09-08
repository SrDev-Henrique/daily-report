import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL não encontrado. Defina no .env (ex: DATABASE_URL=postgres://user:pass@host:5432/dbname)"
  );
}

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
