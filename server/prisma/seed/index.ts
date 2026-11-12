import "dotenv/config";
import { readFileSync } from "node:fs";
import argon2 from "argon2";
import { PlanType, Role } from "../../src/generated/prisma/client.js";
import { encrypt } from "../../src/common/crypto/aes-gcm.js";
import { prisma } from "../../src/common/db/prisma.js";

const PCG_CODE = "CCI";

const ETABS = [
  { code: "CHU-TAMB", nom: "CHU Tambohobe", ordre: 1 },
  { code: "CHU-ANDR", nom: "CHU Andrainjato", ordre: 2 },
  { code: "UNIV-FIA", nom: "Universités de Fianarantsoa", ordre: 3 },
  { code: "CCI", nom: "Chambre de Commerce et de l'Industrialisation", ordre: 4 },
  { code: "EFTA", nom: "EFTA Iboaka", ordre: 5 },
  { code: "CAFPA", nom: "CAFPA Iboaka", ordre: 6 },
].map((e) => ({ ...e, plan: e.code === PCG_CODE ? PlanType.PCG : PlanType.PCOP }));

type CompteJson = { numero: string; intitule: string; niveau: 1 | 2 | 3 };

const load = (f: string) => {
  const rows = (
    JSON.parse(readFileSync(new URL(`./data/${f}`, import.meta.url), "utf8")) as CompteJson[]
  )
    .map((r) => ({ ...r, numero: Number(r.numero) }))
    .filter((r) => r.numero >= 1 && r.numero <= 999);
  const dup = rows.find((r, i) => rows.findIndex((x) => x.numero === r.numero) !== i);
  if (dup) throw new Error(`${f} : numéro en double (${dup.numero})`);
  return rows;
};

async function main() {
  for (const e of ETABS) {
    await prisma.etablissement.upsert({
      where: { code: e.code },
      update: { nom: e.nom, plan: e.plan, ordre: e.ordre },
      create: e,
    });
  }

  for (const [plan, file] of [
    [PlanType.PCOP, "pcop.json"],
    [PlanType.PCG, "pcg.json"],
  ] as const) {
    const rows = load(file);
    for (const r of rows) {
      const data = { intitule: r.intitule, niveau: r.niveau };
      await prisma.planCompte.upsert({
        where: { plan_numero: { plan, numero: r.numero } },
        update: data,
        create: { plan, numero: r.numero, ...data },
      });
    }
    console.log(`${plan} : ${rows.length} comptes`);
  }

  const pwd = process.env.SEED_ADMIN_PASSWORD;
  if (!pwd) throw new Error("SEED_ADMIN_PASSWORD manquant");
  await prisma.user.upsert({
    where: { identifiant: "admin" },
    update: {},
    create: {
      identifiant: "admin",
      nomEnc: encrypt("Administrateur"),
      prenomsEnc: encrypt("Bureau de tutelle"),
      matricule: "ADMIN",
      passwordHash: await argon2.hash(pwd, { type: argon2.argon2id }),
      role: Role.ADMIN,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());