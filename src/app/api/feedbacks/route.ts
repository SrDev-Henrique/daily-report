import { db } from "@/drizzle/db";
import { feedback } from "@/drizzle/schema/feedback";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
} from "@/lib/schema/feedback";
import { deleteSchema } from "@/lib/schema/rounds";
import type { FeedbackUpdateData } from "@/lib/schema/types";
import { and, eq, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

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

    whereClause = and(
      gte(feedback.created_at, start),
      lt(feedback.created_at, end)
    );
  }

  // filtro por intervalo
  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    whereClause = and(
      gte(feedback.created_at, start),
      lt(feedback.created_at, end)
    );
  }

  // busca com paginação e filtro opcional
  const rows = await db
    .select()
    .from(feedback)
    .where(whereClause || undefined)
    .orderBy(feedback.created_at)
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // update path (se veio id)
    if (body?.id) {
      // validação do body de update
      const parse = updateFeedbackSchema.safeParse(body);
      if (!parse.success) {
        return NextResponse.json(
          { error: parse.error.issues },
          { status: 400 }
        );
      }
      const data = parse.data;

      const id = data.id;

      // build do objeto update com os campos que vieram
      const updateData: Record<string, FeedbackUpdateData> = {};
      if (data.created_at !== undefined)
        updateData.created_at = new Date(data.created_at) as FeedbackUpdateData;
      if (data.user_id !== undefined)
        updateData.user_id = data.user_id as FeedbackUpdateData;
      if (data.round_id !== undefined)
        updateData.round_id = data.round_id as FeedbackUpdateData;
      if (data.type !== undefined)
        updateData.type = data.type as FeedbackUpdateData;
      if (data.text !== undefined)
        updateData.text = data.text as FeedbackUpdateData;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: "Nenhum campo para atualizar foi fornecido" },
          { status: 400 }
        );
      }

      const updated = await db
        .update(feedback)
        .set(updateData)
        .where(eq(feedback.id, id))
        .returning();

      if (!updated || updated.length === 0) {
        return NextResponse.json(
          { error: "Feedback não encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json(updated[0]);
    }

    // create path
    const parsed = createFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const valid = parsed.data;

    const insertRow = await db
      .insert(feedback)
      .values({
        user_id: valid.user_id as number,
        round_id: valid.round_id as number,
        date: valid.date,
        type: valid.type as "reclamação" | "elogio",
        text: valid.text as string,
        created_at: valid.created_at ? new Date(valid.created_at) : new Date(),
      })
      .returning();

    return NextResponse.json(insertRow[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/feedbacks error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar request" },
      { status: 500 }
    );
  }
}

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
      .delete(feedback)
      .where(eq(feedback.id, id))
      .returning();

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: "Feedback não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (error) {
    console.error("DELETE /api/feedbacks error:", error);
    return NextResponse.json(
      { error: "Erro interno ao deletar feedback" },
      { status: 500 }
    );
  }
}
