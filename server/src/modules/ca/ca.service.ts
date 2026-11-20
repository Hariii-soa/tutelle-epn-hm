import type { Request } from "express";
import { prisma } from "../../common/db/prisma.js";
import { HttpError } from "../../common/http/errors.js";
import { audit } from "../audit/audit.service.js";
import { getEtablissement } from "../etablissements/etablissements.service.js";
import { sectionOf } from "./ca.rules.js";
import { buildEtat, type LigneView } from "./ca.etat.js";
import { renderEtatSynthese } from "./ca.pdf.js";
import type { ArchivesQuery, LigneInput } from "./ca.schemas.js";

export const MAX_LIGNES = 100;

const getCa = async (id: string) => {
  const d = await prisma.document.findFirst({
    where: { id, type: "CA", etablissement: { actif: true } },
    include: { etablissement: { select: { id: true, code: true, nom: true, plan: true } } },
  });
  if (!d) throw new HttpError(404, "Compte administratif introuvable", "NOT_FOUND");
  return d;
};

const assertBrouillon = (d: { statut: string }) => {
  if (d.statut !== "BROUILLON")
    throw new HttpError(409, "Ce compte administratif est archivé et ne peut plus être modifié", "DOC_LOCKED");
};

async function load(id: string) {
  const [d, rows] = await Promise.all([
    getCa(id),
    prisma.ligneCA.findMany({
      where: { documentId: id },
      include: { compte: { select: { numero: true, intitule: true } } },
    }),
  ]);
  const lignes: LigneView[] = rows
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section) ||
        String(a.compte.numero).localeCompare(String(b.compte.numero)),
    )
    .map((l) => ({
      id: l.id,
      nature: l.nature,
      section: l.section,
      compteId: l.compteId,
      numero: l.compte.numero,
      intitule: l.compte.intitule,
      creditsOuvertsN1: Number(l.creditsOuvertsN1),
      realisation: Number(l.realisation),
    }));
  return { d, lignes };
}

async function view(id: string) {
  const { d, lignes } = await load(id);
  return {
    document: {
      id: d.id,
      exercice: d.exercice,
      exerciceN1: d.exercice - 1,
      statut: d.statut,
      archivedAt: d.archivedAt,
      updatedAt: d.updatedAt,
    },
    etablissement: { id: d.etablissement.id, code: d.etablissement.code, nom: d.etablissement.nom },
    etat: buildEtat(lignes),
    nbLignes: lignes.length,
    maxLignes: MAX_LIGNES,
  };
}

const touch = (id: string, userId: string) =>
  prisma.document.update({ where: { id }, data: { updatedById: userId }, select: { id: true } });

// UC01 : ouvre (ou crée) le CA d'un EPN pour un exercice
export async function ouvrir(req: Request, { etablissementId, exercice }: { etablissementId: string; exercice: number }) {
  await getEtablissement(etablissementId);
  const uid = req.user!.id;
  const d = await prisma.document.upsert({
    where: { etablissementId_exercice_type_rubrique: { etablissementId, exercice, type: "CA", rubrique: "GLOBAL" } },
    update: {},
    create: { etablissementId, exercice, type: "CA", createdById: uid, updatedById: uid },
  });
  return view(d.id);
}

// UC02 / UC03 : « Ajouter »
export async function addLignes(req: Request, id: string, lignes: LigneInput[]) {
  const doc = await getCa(id);
  assertBrouillon(doc);

  const ids = [...new Set(lignes.map((l) => l.compteId))];
  const comptes = await prisma.planCompte.findMany({
    where: { id: { in: ids }, plan: doc.etablissement.plan, niveau: { gte: 2 } },
    select: { id: true, numero: true },
  });
  if (comptes.length !== ids.length)
    throw new HttpError(400, "Données invalides", "VALIDATION", {
      compteId: "Compte invalide pour cet établissement",
    });
  const numero = new Map(comptes.map((c) => [c.id, c.numero]));

  const count = await prisma.ligneCA.count({ where: { documentId: id } });
  if (count + lignes.length > MAX_LIGNES)
    throw new HttpError(422, `Limite de ${MAX_LIGNES} lignes atteinte`, "LIMIT_REACHED");

  try {
    await prisma.ligneCA.createMany({
      data: lignes.map((l) => ({
        documentId: id,
        nature: l.nature,
        section: sectionOf(numero.get(l.compteId)!),
        compteId: l.compteId,
        creditsOuvertsN1: BigInt(l.creditsOuvertsN1),
        realisation: BigInt(l.realisation),
      })),
    });
  } catch (e: any) {
    throw e?.code === "P2002"
      ? new HttpError(409, "Compte déjà ajouté", "CONFLICT", { compteId: "Ce compte est déjà ajouté" })
      : e;
  }
  await touch(id, req.user!.id);
  await audit(req, "DOC_SAVE", { entite: "Document", entiteId: id, details: { type: "CA", op: "ajout", n: lignes.length } });
  return view(id);
}

export async function removeLigne(req: Request, id: string, ligneId: string) {
  assertBrouillon(await getCa(id));
  const { count } = await prisma.ligneCA.deleteMany({ where: { id: ligneId, documentId: id } });
  if (!count) throw new HttpError(404, "Ligne introuvable", "NOT_FOUND");
  await touch(id, req.user!.id);
  await audit(req, "DOC_SAVE", { entite: "Document", entiteId: id, details: { type: "CA", op: "suppression" } });
  return view(id);
}

// UC04 : « Enregistrer » = archivage de l'état de synthèse
export async function archive(req: Request, id: string) {
  assertBrouillon(await getCa(id));
  if (!(await prisma.ligneCA.count({ where: { documentId: id } })))
    throw new HttpError(422, "Ajoutez au moins une ligne avant d'enregistrer", "INCOMPLETE");

  const { count } = await prisma.document.updateMany({
    where: { id, statut: "BROUILLON" },
    data: { statut: "ARCHIVE", archivedAt: new Date(), updatedById: req.user!.id },
  });
  if (!count) throw new HttpError(409, "Ce compte administratif est déjà archivé", "DOC_LOCKED");

  await audit(req, "DOC_ARCHIVE", { entite: "Document", entiteId: id, details: { type: "CA" } });
  return view(id);
}

// UC06 : onglet « Liste des états de synthèse précédents »
export async function listArchives({ etablissementId, exercice }: ArchivesQuery) {
  const etab = await getEtablissement(etablissementId);
  const docs = await prisma.document.findMany({
    where: { type: "CA", archivedAt: { not: null }, etablissementId, ...(exercice && { exercice }) },
    orderBy: { exercice: "desc" },
    select: { id: true, exercice: true, statut: true, archivedAt: true },
  });
  return {
    etablissement: { id: etab.id, code: etab.code, nom: etab.nom },
    archives: docs.map((d) => ({
      id: d.id,
      exercice: d.exercice,
      titre: `Compte administratif — Exercice ${d.exercice}`,
      statut: d.statut, // ARCHIVE → « Archivé », VALIDE → « Validé »
      archivedAt: d.archivedAt, // « Enregistré le »
    })),
  };
}

// « Consulter »
export const consulter = (id: string) => view(id);

// « Générer PDF » : produit à la volée depuis les données archivées, rien n'est stocké
export async function pdf(req: Request, id: string, op: "pdf" | "impression") {
  const { d, lignes } = await load(id);
  if (d.statut !== "ARCHIVE" || !d.archivedAt)
    throw new HttpError(409, "Seul un état de synthèse enregistré peut être imprimé ou généré en PDF", "NOT_ARCHIVED");
  const buffer = await renderEtatSynthese({
    etablissement: d.etablissement.nom,
    exercice: d.exercice,
    archivedAt: d.archivedAt,
    sections: buildEtat(lignes),
  });
  await audit(req, "DOC_PRINT", { entite: "Document", entiteId: id, details: { type: "CA", op } });
  return { buffer, filename: `compte-administratif-${d.etablissement.code}-${d.exercice}.pdf` };
}