// src/app/api/rounds/route.ts
import { and, gte, lt, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rounds } from "@/drizzle/schema/rounds";
import { z } from "zod";
import { createRoundSchema, deleteSchema, updateRoundSchema } from "@/lib/schema/rounds";

/**
 * GET
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // parâmetros opcionais
  const date = url.searchParams.get("date");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);

  const offset = (page - 1) * limit;

  let whereClause = undefined;

  // filtro por date
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    whereClause = and(gte(rounds.time, start), lt(rounds.time, end));
  }

  // filtro por intervalo
  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    whereClause = and(gte(rounds.time, start), lt(rounds.time, end));
  }

  // busca com paginação e filtro opcional
  const rows = await db
    .select()
    .from(rounds)
    .where(whereClause || undefined)
    .orderBy(rounds.time)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      nextPage: rows.length === limit ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  });
}

/**
 * POST -> cria ou atualiza (se body.id existir)
 * - valida com zod
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // update path (se veio id)
    if (body?.id) {
      // validação do body de update
      const parse = updateRoundSchema.safeParse(body);
      if (!parse.success) {
        return NextResponse.json(
          { error: parse.error.format() },
          { status: 400 }
        );
      }
      const data = parse.data;

      const id = data.id;

      // build do objeto update com os campos que vieram
      const updateData: Record<string, any> = {};
      if (data.time !== undefined) updateData.time = new Date(data.time);
      if (data.user_id !== undefined) updateData.user_id = data.user_id;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.checklist !== undefined) updateData.checklist = data.checklist;
      if (data.notes !== undefined) updateData.notes = data.notes;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "Nenhum campo para atualizar foi fornecido" },
          { status: 400 }
        );
      }

      const updated = await db
        .update(rounds)
        .set(updateData)
        .where(eq(rounds.id, id))
        .returning();

      if (!updated || updated.length === 0) {
        return NextResponse.json(
          { error: "Ronda não encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json(updated[0]);
    }

    // create path
    const parsed = createRoundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }
    const valid = parsed.data;

    const insertRow = await db
      .insert(rounds)
      .values({
        time: valid.time ? new Date(valid.time) : new Date(),
        user_id: valid.user_id,
        status: valid.status ?? "pendente",
        checklist: valid.checklist ?? {
          limpeza: {
            salao: "pendente",
            banheiro_masculino: "pendente",
            banheiro_hc_masculino: "pendente",
            banheiro_feminino: "pendente",
            banheiro_hc_feminino: "pendente",
            copa: "pendente",
            area_servico: "pendente",
            area_cozinha: "pendente",
            area_bar: "pendente",
          },
          buffet: "pendente",
          geladeira: "pendente",
        },
        notes: valid.notes ?? null,
      })
      .returning();

    return NextResponse.json(insertRow[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/rounds error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE -> aceita ?id=123 ou body { id: 123 } e valida com zod
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    let id: number | null = null;

    if (idParam) {
      // tenta transformar string em number e validar
      const parsed = z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .safeParse(idParam);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "id inválido na querystring" },
          { status: 400 }
        );
      }
      id = parsed.data;
    } else {
      // tenta ler id do body
      try {
        const body = await request.json();
        if (body?.id) {
          const parsed = z.number().int().positive().safeParse(body.id);
          if (!parsed.success) {
            return NextResponse.json(
              { error: "id inválido no body" },
              { status: 400 }
            );
          }
          id = parsed.data;
        }
      } catch {
        // body inválido ou vazio -> ignore
      }
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // valida usando o deleteSchema para ter garantia extra
    const d = deleteSchema.safeParse({ id });
    if (!d.success) {
      return NextResponse.json({ error: d.error.format() }, { status: 400 });
    }

    const deleted = await db
      .delete(rounds)
      .where(eq(rounds.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Ronda não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("DELETE /api/rounds error:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar ronda" },
      { status: 500 }
    );
  }
}
