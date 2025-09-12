// scripts/seed.ts
import { db } from "../src/drizzle/db";
import { users } from "../src/drizzle/schema/user";
import "dotenv/config";
import { rounds } from "../src/drizzle/schema/rounds";
import type { status } from "@/lib/schema/types";

async function seed() {
  // cria 2 usuários (sem hash — para dev; substitua por hash em prod)
  await db.insert(users).values([
    {
      name: "Henrique",
      email: "henrique@example.com",
      password_hash: "password",
      role: "operator",
      id: 1,
    },
    {
      name: "Juliana",
      email: "sup@example.com",
      password_hash: "password",
      role: "supervisor",
      id: 2,
    },
  ]);

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );

  // cria algumas rondas
  await db.insert(rounds).values([
    {
      id: 1,
      date: today.toISOString(),
      index: 1,
      created_at: today,
      started_at: today,
      finished_at: today,
      duration: 0,
      user_id: 1,
      status: "pendente" as status,
      checklist: {
        limpeza: {
          salao: "pendente" as status,
          banheiro_masculino: "pendente" as status,
          banheiro_hc_masculino: "pendente" as status,
          banheiro_feminino: "pendente" as status,
          banheiro_hc_feminino: "pendente" as status,
          copa: "pendente" as status,
          area_servico: "pendente" as status,
          area_cozinha: "pendente" as status,
          area_bar: "pendente" as status,
        },
        buffet: "pendente" as status,
        geladeira: "pendente" as status,
      },
      notes: "Primeira ronda de teste",
    },
  ]);

  console.log("✅ Seed concluído");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
