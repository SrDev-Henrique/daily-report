CREATE TYPE "public"."category" AS ENUM('técnico', 'atendimento', 'limpeza', 'buffet', 'outro');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('baixa', 'media', 'alta', 'urgente');--> statement-breakpoint
ALTER TYPE "public"."checklist_status" ADD VALUE 'em progresso' BEFORE 'não feito';--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "severity" SET DEFAULT 'baixa'::"public"."severity";--> statement-breakpoint
ALTER TABLE "issues" ALTER COLUMN "severity" SET DATA TYPE "public"."severity" USING "severity"::"public"."severity";--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "index" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "rounds" DROP COLUMN "time";