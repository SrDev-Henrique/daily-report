import { z } from "zod";

export const categoryEnum = z.enum(["técnico", "atendimento", "limpeza", "buffet", "outro"]);
export const severityEnum = z.enum(["baixa", "media", "alta", "urgente"]);

export const createIssueSchema = z.object({
    id: z.number().int().positive(),
    round_id: z.number().int().positive(),
    category: categoryEnum,
    severity: severityEnum,
    description: z.string(),
    created_at: z.string(),
});

export const updateIssueSchema = z.object({
  id: z.number().int().positive(),
  round_id: z.number().int().positive(),
  category: categoryEnum,
  severity: severityEnum,
  description: z.string(),
  created_at: z.string(),
});

export const deleteIssueSchema = z.object({
  id: z.number().int().positive(),
});
