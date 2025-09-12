// src/app/api/rounds/[id]/finish/route.ts
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rounds } from "@/drizzle/schema/rounds";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { RoundsUpdateData } from "@/lib/schema/types";

/**
 * PATCH /api/rounds/:id/finish
 *
 * - Espera body com campos opcionais:
 *   { finished_at?: ISOstring, checklist?: object, notes?: string | null, status?: "ok"|"pendente"|"em progresso"|"não feito" }
 * - Calcula duration = finished_at - started_at (em segundos) se started_at existir.
 * - Atualiza o registro e retorna o objeto atualizado.
 */

/** valida id param */
const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

/** esquema do body */
const finishBodySchema = z.object({
  finished_at: z.string().optional(),
  checklist: z.any().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["ok", "pendente", "em progresso", "não feito"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const paramsObj = await params;
  const parsedId = idParamSchema.safeParse(paramsObj);
  if (!parsedId.success)
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const id = parsedId.data.id;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsedBody = finishBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues },
      { status: 400 }
    );
  }
  const { finished_at, checklist, notes, status } = parsedBody.data;

  try {
    // busca ronda atual
    const [current] = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, id))
      .limit(1);
    if (!current)
      return NextResponse.json(
        { error: "Ronda não encontrada" },
        { status: 404 }
      );

    // determina finishedAt e calcula duration
    const finishedAt = finished_at ? new Date(finished_at) : new Date();
    const startedAt = current.started_at ? new Date(current.started_at) : null;
    const duration = startedAt
      ? Math.max(
          0,
          Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000)
        )
      : null;

    const updateData: Partial<RoundsUpdateData> = {
      finished_at: finishedAt,
    };

    if (duration !== null) updateData.duration = duration;

    if (checklist !== undefined) updateData.checklist = checklist;
    if (notes !== undefined) updateData.notes = notes;
    updateData.status = status ?? "ok";

    const updated = await db
      .update(rounds)
      .set(updateData)
      .where(eq(rounds.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PATCH /api/rounds/:id/finish error:", error);
    return NextResponse.json(
      { error: "Erro interno ao finalizar ronda" },
      { status: 500 }
    );
  }
}
