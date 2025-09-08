// scripts/seed.ts
import "dotenv/config";
import { db } from "../src/drizzle/db";
import { users } from "../src/drizzle/schema/user";
import { rounds } from "../src/drizzle/schema/rounds";

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
      time: now,
      user_id: 7,
      status: "pendente",
      checklist: {
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
