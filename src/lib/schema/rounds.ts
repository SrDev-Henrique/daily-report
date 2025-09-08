import { z } from "zod";


// valores possíveis para cada área de limpeza / buffet / geladeira
export const statusEnum = z.enum(["ok", "pendente", "não feito"]);

// checklist detalhado
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

// schema para criação de ronda
export const createRoundSchema = z.object({
  user_id: z.number().int().positive(),
  time: z.string().optional(), // ISO string
  status: statusEnum.optional(),
  checklist: checklistSchema.optional(),
  notes: z.string().nullable().optional(),
});

// schema para atualização (id obrigatório, resto parcial)
export const updateRoundSchema = z
  .object({
    id: z.number().int().positive(),
    user_id: z.number().int().positive().optional(),
    time: z.string().optional(),
    status: statusEnum.optional(),
    checklist: checklistSchema.optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

// schema para delete (aceita id como string/query transformada a number)
export const deleteSchema = z.object({
  id: z.number().int().positive(),
});
