// src/app/api/rounds/route.ts
import { and, gte, lte, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { rounds } from "@/drizzle/schema/rounds";
import { z } from "zod";
import { createRoundSchema, deleteSchema } from "@/lib/schema/rounds";
import type { status as ChecklistStatus } from "@/lib/schema/types";

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

  // filtro por date (coluna é do tipo date/string no Drizzle)
  if (date) {
    whereClause = eq(rounds.date, date);
  }

  // filtro por intervalo (usar strings YYYY-MM-DD)
  if (startDate && endDate) {
    whereClause = and(gte(rounds.date, startDate), lte(rounds.date, endDate));
  }

  // busca com paginação e filtro opcional
  const rows = await db
    .select()
    .from(rounds)
    .where(whereClause || undefined)
    .orderBy(rounds.date)
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

    // create path
    const parsed = createRoundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const valid = parsed.data;

    const insertRow = await db
      .insert(rounds)
      .values({
        date: valid.date,
        index: valid.index,
        created_at: valid.created_at ? new Date(valid.created_at) : new Date(),
        user_id: valid.user_id,
        started_at: valid.started_at ? new Date(valid.started_at) : null,
        finished_at: valid.finished_at ? new Date(valid.finished_at) : null,
        duration: valid.duration ? valid.duration : null,
        status: valid.status ?? "pendente",
        checklist: valid.checklist ?? {
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
      return NextResponse.json({ error: d.error.issues }, { status: 400 });
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
