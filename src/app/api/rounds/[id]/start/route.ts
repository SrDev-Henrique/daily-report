// src/app/api/rounds/[id]/start/route.ts
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rounds } from "@/drizzle/schema/rounds";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { status as ChecklistStatus } from "@/lib/schema/types";

/**
 * PATCH /api/rounds/:id/start
 *
 * - Se existir uma ronda com esse id, atualiza started_at (ou seta para agora)
 *   e status -> "em progresso".
 * - Se não existir, permite criar uma ronda mínima se o body trouxer
 *   { date: "YYYY-MM-DD", index: number, user_id: number } e started_at optional.
 *
 * Retorno: ronda atualizada/criada.
 */

/** valida id param */
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

/** body para start: started_at opcional (ISO string) */
const startBodySchema = z.object({
  started_at: z.string().optional(), // ISO datetime string (ex: 2025-09-10T03:00:00Z)
  // caso queira criar se o id não existir:
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  index: z.number().int().min(0).max(9).optional(),
  user_id: z.number().int().positive().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // valida id
  const paramsObj = await params;
  const parsedId = idParamSchema.safeParse(paramsObj);
  if (!parsedId.success) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const id = parsedId.data.id;

  // parse body (não obrigatório)
  let body: unknown = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }
  const parsedBody = startBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues },
      { status: 400 }
    );
  }
  const { started_at, date, index, user_id } = parsedBody.data;

  // compute startedAt
  const startedAt = started_at ? new Date(started_at) : new Date();

  try {
    // tenta atualizar primeiro (se existir)
    const [existing] = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, id))
      .limit(1);

    if (existing) {
      const updated = await db
        .update(rounds)
        .set({
          started_at: startedAt,
          status: "em progresso", // usa o enum do DB ("em progresso")
        })
        .where(eq(rounds.id, id))
        .returning();

      return NextResponse.json(updated[0]);
    }

    // se não existir: cria nova ronda mínima — exige date, index e user_id no body
    if (!date || index === undefined || !user_id) {
      return NextResponse.json(
        {
          error:
            "Ronda não encontrada. Para criar uma nova passe date, index e user_id no body.",
        },
        { status: 404 }
      );
    }

    // cria com checklist padrão
    const defaultChecklist = {
      limpeza: {
        salao: "pendente" as ChecklistStatus,
        banheiro_masculino: "pendente" as ChecklistStatus,
        banheiro_hc_masculino: "pendente" as ChecklistStatus,
        banheiro_feminino: "pendente" as ChecklistStatus,
        banheiro_hc_feminino: "pendente" as ChecklistStatus,
        copa: "pendente" as ChecklistStatus,
        area_servico: "pendente" as ChecklistStatus,
        area_cozinha: "pendente" as ChecklistStatus,
        area_bar: "pendente" as ChecklistStatus,
      },
      buffet: "pendente" as ChecklistStatus,
      geladeira: "pendente" as ChecklistStatus,
    };

    const insert = await db
      .insert(rounds)
      .values({
        date,
        index,
        created_at: new Date(),
        user_id,
        started_at: startedAt,
        finished_at: null,
        duration: null,
        status: "em progresso",
        checklist: defaultChecklist,
        notes: null,
      })
      .returning();

    return NextResponse.json(insert[0], { status: 201 });
  } catch (error) {
    console.error("PATCH /api/rounds/:id/start error:", error);
    return NextResponse.json(
      { error: "Erro interno ao iniciar ronda" },
      { status: 500 }
    );
  }
}
