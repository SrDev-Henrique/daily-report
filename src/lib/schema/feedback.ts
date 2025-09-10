import { z } from "zod";

export const typeEnum = z.enum(["reclamação", "elogio"]);

export const createFeedbackSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(),
  round_id: z.number().int().positive(),
  date: z.string(),
  type: typeEnum,
  text: z.string(),
  created_at: z.string(),
});

export const updateFeedbackSchema = z
  .object({
    id: z.number().int().positive(),
    user_id: z.number().int().positive().optional(),
    round_id: z.number().int().positive(),
    date: z.string(),
    type: typeEnum,
    text: z.string(),
    created_at: z.string(),
  })
  .strict();

export const deleteFeedbackSchema = z.object({
  id: z.number().int().positive(),
});
