// src/app/api/rounds/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rounds } from "@/drizzle/schema/rounds";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { updateRoundSchema } from "@/lib/schema/rounds";
import type { RoundsUpdateData } from "@/lib/schema/types";

/**
 * Helpers
 */
const idParamSchema = z.object({ id: z.string().regex(/^\d+$/).transform(Number) });

// patch schema: reutiliza o updateRoundSchema sem o id e torna tudo opcional
const patchRoundSchema = updateRoundSchema
  .omit({ id: true })
  .partial();

/**
 * GET -> retorna 1 ronda por id
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const paramsObj = await params;
  const parsed = idParamSchema.safeParse(paramsObj);
  if (!parsed.success) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const id = parsed.data.id;

  try {
    const [row] = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Ronda não encontrada" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    console.error("GET /api/rounds/:id error", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * PATCH -> atualização parcial da ronda
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const paramsObj = await params;
  const parsedId = idParamSchema.safeParse(paramsObj);
  if (!parsedId.success) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const id = parsedId.data.id;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "body inválido ou ausente" }, { status: 400 });
  }

  const parsed = patchRoundSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const updateData: Record<string, RoundsUpdateData> = {};

  // Conversões seguras: date fica string YYYY-MM-DD; timestamps viram Date
  try {
    if (data.date !== undefined) updateData.date = data.date as RoundsUpdateData;
    if (data.created_at !== undefined) updateData.created_at = new Date(data.created_at as string) as RoundsUpdateData;
    if (data.index !== undefined) updateData.index = data.index as RoundsUpdateData;
    if (data.started_at !== undefined) updateData.started_at = new Date(data.started_at as string) as RoundsUpdateData;
    if (data.finished_at !== undefined) updateData.finished_at = new Date(data.finished_at as string) as RoundsUpdateData;
    if (data.duration !== undefined) updateData.duration = data.duration as RoundsUpdateData;
    if (data.user_id !== undefined) updateData.user_id = data.user_id as RoundsUpdateData;
    if (data.status !== undefined) updateData.status = data.status as RoundsUpdateData;
    if (data.checklist !== undefined) updateData.checklist = data.checklist as RoundsUpdateData;
    if (data.notes !== undefined) updateData.notes = data.notes as RoundsUpdateData;
  } catch (e) {
    return NextResponse.json({ error: e as string }, { status: 400 });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  try {
    const updated = await db.update(rounds).set(updateData).where(eq(rounds.id, id)).returning();
    if (!updated || updated.length === 0) return NextResponse.json({ error: "Ronda não encontrada" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error("PATCH /api/rounds/:id error", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE -> deleta por id
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const paramsObj = await params;
  const parsed = idParamSchema.safeParse(paramsObj);
  if (!parsed.success) return NextResponse.json({ error: "id inválido" }, { status: 400 });
  const id = parsed.data.id;

  try {
    const deleted = await db.delete(rounds).where(eq(rounds.id, id)).returning();
    if (!deleted || deleted.length === 0) return NextResponse.json({ error: "Ronda não encontrada" }, { status: 404 });
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (err) {
    console.error("DELETE /api/rounds/:id error", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
