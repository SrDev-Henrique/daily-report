import { z } from "zod";

export const statusEnum = z.enum(["ok", "pendente", "em progresso", "não feito"]);

export const checklistSchema = z.object({
  limpeza: z.object({
    salao: statusEnum,
    banheiro_masculino: statusEnum,
    banheiro_hc_masculino: statusEnum,
    banheiro_feminino: statusEnum,
    banheiro_hc_feminino: statusEnum,
    copa: statusEnum,
    area_servico: statusEnum,
    area_cozinha: statusEnum,
    area_bar: statusEnum,
  }),
  buffet: statusEnum,
  geladeira: statusEnum,
});

const optionalIsoString = z.string().optional();

export const createRoundSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  index: z.number().int().positive(),
  created_at: optionalIsoString,
  started_at: optionalIsoString,
  finished_at: optionalIsoString,
  duration: z.number().optional(),
  status: statusEnum.optional(),
  checklist: checklistSchema.optional(),
  notes: z.string().nullable().optional(),
});

export const updateRoundSchema = z
  .object({
    id: z.number().int().positive(),
    user_id: z.number().int().positive().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
    index: z.number().int().min(0).max(9),
    created_at: optionalIsoString,
    started_at: optionalIsoString,
    finished_at: optionalIsoString,
    duration: z.number().int().nonnegative().optional(),
    status: statusEnum.optional(),
    checklist: checklistSchema.optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export const deleteSchema = z.object({
  id: z.number().int().positive(),
});
