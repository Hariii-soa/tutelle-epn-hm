import { prisma } from "../../common/db/prisma.js";
import { currentYearMg } from "../../common/time.js";

const DOCS_PAR_EPN = 2; // BA + CA

export async function getDashboard() {
  const exercice = currentYearMg();
  const [etabs, docs] = await Promise.all([
    prisma.etablissement.findMany({
      where: { actif: true },
      orderBy: { ordre: "asc" },
      select: { id: true, code: true, nom: true },
    }),
    prisma.document.findMany({
      where: { exercice, archivedAt: { not: null }, etablissement: { actif: true } },
      select: { etablissementId: true, type: true, updatedAt: true },
    }),
  ]);

  const etablissements = etabs.map((e) => {
    const mine = docs.filter((d) => d.etablissementId === e.id);
    const budgetAdditionnel = mine.some((d) => d.type === "BA");
    const compteAdministratif = mine.some((d) => d.type === "CA");
    const derniereMiseAJour = mine.reduce<Date | null>(
      (max, d) => (!max || d.updatedAt > max ? d.updatedAt : max),
      null,
    );
    return {
      id: e.id,
      code: e.code,
      nom: e.nom,
      budgetAdditionnel,
      compteAdministratif,
      termines: Number(budgetAdditionnel) + Number(compteAdministratif),
      total: DOCS_PAR_EPN,
      derniereMiseAJour,
    };
  });

  const termines = etablissements.reduce((s, e) => s + e.termines, 0);
  const total = etablissements.length * DOCS_PAR_EPN;

  return {
    exercice,
    progression: { termines, total, pourcentage: total ? Math.round((termines * 100) / total) : 0 },
    etablissements,
  };
}