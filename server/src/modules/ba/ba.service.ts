import type { Request } from "express";
import { prisma } from "../../common/db/prisma.js";
import { HttpError } from "../../common/http/errors.js";
import { audit } from "../audit/audit.service.js";
import { getEtablissement } from "../etablissements/etablissements.service.js";
import { RUBRIQUE_META, type BaRubrique } from "./ba.rules.js";
import type { ArchivesQuery, LigneBaInput, LigneModifInput } from "./ba.schemas.js";
import { renderBudgetAdditionnel } from "../../common/pdf/pdf.service.js";
import { readPdf, savePdf } from "../../common/storage/archive.service.js";
import { formatDateMg } from "../../common/time.js";

export const MAX_LIGNES = 100;

const getBa = async (id: string) => {
  const d = await prisma.document.findFirst({
    where: { id, type: "BA", etablissement: { actif: true } },
    include: { etablissement: { select: { id: true, code: true, nom: true, plan: true } } },
  });
  if (!d) throw new HttpError(404, "Budget additionnel introuvable", "NOT_FOUND");
  return d;
};

const assertBrouillon = (d: { statut: string }) => {
  if (d.statut !== "BROUILLON")
    throw new HttpError(409, "Ce budget additionnel est archivé et ne peut plus être modifié", "DOC_LOCKED");
};

async function view(id: string) {
  const [d, rows] = await Promise.all([
    getBa(id),
    prisma.ligneBA.findMany({
      where: { documentId: id },
      include: { compte: { select: { numero: true, intitule: true } } },
    }),
  ]);
  const lignes = rows
    .sort((a, b) => String(a.compte.numero).localeCompare(String(b.compte.numero)))
    .map((l) => ({
      id: l.id,
      compteId: l.compteId,
      numero: l.compte.numero,
      intitule: l.compte.intitule,
      budgetPrimitif: Number(l.budgetPrimitif),
      excedent: Number(l.excedent),
      budgetAdditionnel: Number(l.budgetAdditionnel),
    }));
  const sum = (k: "budgetPrimitif" | "excedent" | "budgetAdditionnel") =>
    lignes.reduce((s, l) => s + l[k], 0);
  const meta = RUBRIQUE_META[d.rubrique as BaRubrique];
  return {
        document: {
      id: d.id,
      exercice: d.exercice,
      rubrique: d.rubrique,
      code: meta.code,
      label: meta.label,
      titre: `${meta.label} ${d.exercice}`,
      section: meta.section,
      statut: d.statut,
      archivedAt: d.archivedAt, // « Enregistré le »
      updatedAt: d.updatedAt,
    },
    etablissement: { id: d.etablissement.id, code: d.etablissement.code, nom: d.etablissement.nom },
    lignes,
    totaux: { budgetPrimitif: sum("budgetPrimitif"), excedent: sum("excedent"), budgetAdditionnel: sum("budgetAdditionnel") },
    nbLignes: lignes.length,
    maxLignes: MAX_LIGNES,
  };
}

const touch = (id: string, userId: string) =>
  prisma.document.update({ where: { id }, data: { updatedById: userId }, select: { id: true } });

// Ouvre (ou crée) le BA d'un EPN pour un exercice et une section
export async function ouvrir(
  req: Request,
  { etablissementId, exercice, rubrique }: { etablissementId: string; exercice: number; rubrique: BaRubrique },
) {
  await getEtablissement(etablissementId);
  const uid = req.user!.id;
  const d = await prisma.document.upsert({
    where: { etablissementId_exercice_type_rubrique: { etablissementId, exercice, type: "BA", rubrique } },
    update: {},
    create: { etablissementId, exercice, type: "BA", rubrique, createdById: uid, updatedById: uid },
  });
  return view(d.id);
}

// « Ajouter » : une ligne
export async function addLigne(req: Request, id: string, l: LigneBaInput) {
  const doc = await getBa(id);
  assertBrouillon(doc);

  const compte = await prisma.planCompte.findFirst({
    where: { id: l.compteId, plan: doc.etablissement.plan, niveau: { gte: 2 } },
    select: { id: true },
  });
  if (!compte)
    throw new HttpError(400, "Données invalides", "VALIDATION", {
      compteId: "Compte invalide pour cet établissement",
    });

  if ((await prisma.ligneBA.count({ where: { documentId: id } })) >= MAX_LIGNES)
    throw new HttpError(422, `Limite de ${MAX_LIGNES} lignes atteinte`, "LIMIT_REACHED");

  try {
    await prisma.ligneBA.create({
      data: {
        documentId: id,
        section: RUBRIQUE_META[doc.rubrique as BaRubrique].section,
        compteId: l.compteId,
        budgetPrimitif: BigInt(l.budgetPrimitif),
        excedent: BigInt(l.excedent),
        budgetAdditionnel: BigInt(l.budgetAdditionnel),
      },
    });
  } catch (e: any) {
    throw e?.code === "P2002"
      ? new HttpError(409, "Compte déjà ajouté", "CONFLICT", { compteId: "Ce compte est déjà ajouté" })
      : e;
  }
  await touch(id, req.user!.id);
  await audit(req, "DOC_SAVE", {
    entite: "Document",
    entiteId: id,
    details: { type: "BA", rubrique: doc.rubrique, op: "ajout" },
  });
  return view(id);
}

export async function removeLigne(req: Request, id: string, ligneId: string) {
  const doc = await getBa(id);
  assertBrouillon(doc);
  const { count } = await prisma.ligneBA.deleteMany({ where: { id: ligneId, documentId: id } });
  if (!count) throw new HttpError(404, "Ligne introuvable", "NOT_FOUND");
  await touch(id, req.user!.id);
  await audit(req, "DOC_SAVE", {
    entite: "Document",
    entiteId: id,
    details: { type: "BA", rubrique: doc.rubrique, op: "suppression" },
  });
  return view(id);
}

// « Enregistrer » = archivage
export async function archive(req: Request, id: string) {
  const doc = await getBa(id);
  assertBrouillon(doc);
  const v = await view(id);
  if (!v.nbLignes) throw new HttpError(422, "Ajoutez au moins une ligne avant d'enregistrer", "INCOMPLETE");

  const archivedAt = new Date();
  const pdf = await renderBudgetAdditionnel({
    exercice: doc.exercice,
    etablissement: doc.etablissement.nom,
    rubriqueLabel: v.document.label,
    section: v.document.section,
    lignes: v.lignes,
    totaux: v.totaux,
    editeLe: formatDateMg(archivedAt),
  });
  const file = await savePdf(pdf, {
    etabCode: doc.etablissement.code,
    exercice: doc.exercice,
    name: `BA-${v.document.code}`,
  });

  const { count } = await prisma.document.updateMany({
    where: { id, statut: "BROUILLON" },
    data: { statut: "ARCHIVE", archivedAt, updatedById: req.user!.id, ...file },
  });
  if (!count) throw new HttpError(409, "Ce budget additionnel est déjà archivé", "DOC_LOCKED");

  await audit(req, "DOC_ARCHIVE", {
    entite: "Document",
    entiteId: id,
    details: { type: "BA", rubrique: doc.rubrique, sha256: file.pdfSha256 },
  });
  return view(id);
}

//reouverture
export async function reouvrir(req: Request, id: string) {
  const doc = await getBa(id);
  if (doc.statut !== "ARCHIVE")
    throw new HttpError(409, "Seul un budget additionnel archivé peut être réouvert", "NOT_ARCHIVED");
  const { count } = await prisma.document.updateMany({
    where: { id, statut: "ARCHIVE" },
    data: { statut: "BROUILLON", updatedById: req.user!.id }, // archivedAt conservé : la case du tableau de bord reste cochée
  });
  if (!count) throw new HttpError(409, "Ce budget additionnel n'est plus archivé", "NOT_ARCHIVED");
  await audit(req, "BA_MODIFY", {
    entite: "Document",
    entiteId: id,
    details: { type: "BA", rubrique: doc.rubrique, op: "reouverture" },
  });
  return view(id);
}

// Onglet « Archives » : BA archivés d'un EPN
export async function listArchives({ etablissementId, exercice }: ArchivesQuery) {
  const etab = await getEtablissement(etablissementId);
  const docs = await prisma.document.findMany({
    where: { type: "BA", statut: "ARCHIVE", etablissementId, ...(exercice && { exercice }) },
    orderBy: [{ exercice: "desc" }, { archivedAt: "desc" }],
    select: { id: true, exercice: true, rubrique: true, archivedAt: true },
  });
  return {
    etablissement: { id: etab.id, code: etab.code, nom: etab.nom },
    archives: docs.map((d) => {
      const meta = RUBRIQUE_META[d.rubrique as BaRubrique];
      return {
        id: d.id,
        exercice: d.exercice,
        rubrique: d.rubrique,
        code: meta.code,
        titre: `${meta.label} ${d.exercice}`,
        statut: "ARCHIVE" as const,
        archivedAt: d.archivedAt,
      };
    }),
  };
}

// Consultation
export const consulter = (id: string) => view(id);

// « Enregistrer les modifications » : montants d'un BA archivé
export async function modifier(req: Request, id: string, lignes: LigneModifInput[]) {
  const doc = await getBa(id);
  if (doc.statut !== "BROUILLON")
    throw new HttpError(409, "Réouvrez le budget additionnel avant de le modifier", "NOT_REOPENED");

  const current = await prisma.ligneBA.findMany({
    where: { documentId: id, id: { in: lignes.map((l) => l.id) } },
  });
  if (current.length !== lignes.length) throw new HttpError(404, "Ligne introuvable", "NOT_FOUND");

  const byId = new Map(current.map((l) => [l.id, l]));
  const changes = lignes.filter((n) => {
    const o = byId.get(n.id)!;
    return (
      o.budgetPrimitif !== BigInt(n.budgetPrimitif) ||
      o.excedent !== BigInt(n.excedent) ||
      o.budgetAdditionnel !== BigInt(n.budgetAdditionnel)
    );
  });
  if (!changes.length) throw new HttpError(422, "Aucune modification à enregistrer", "NO_CHANGE");

  await prisma.$transaction([
    ...changes.map((n) =>
      prisma.ligneBA.update({
        where: { id: n.id },
        data: {
          budgetPrimitif: BigInt(n.budgetPrimitif),
          excedent: BigInt(n.excedent),
          budgetAdditionnel: BigInt(n.budgetAdditionnel),
        },
      }),
    ),
    prisma.document.update({ where: { id }, data: { updatedById: req.user!.id } }),
  ]);

  await audit(req, "BA_MODIFY", {
    entite: "Document",
    entiteId: id,
    details: {
      type: "BA",
      rubrique: doc.rubrique,
      lignes: changes.map((n) => {
        const o = byId.get(n.id)!;
        return {
          ligneId: n.id,
          avant: {
            budgetPrimitif: Number(o.budgetPrimitif),
            excedent: Number(o.excedent),
            budgetAdditionnel: Number(o.budgetAdditionnel),
          },
          apres: { budgetPrimitif: n.budgetPrimitif, excedent: n.excedent, budgetAdditionnel: n.budgetAdditionnel },
        };
      }),
    },
  });
  return view(id);
}

//lecture pdf
export async function lirePdf(req: Request, id: string) {
  const doc = await getBa(id);
  if (doc.statut !== "ARCHIVE" || !doc.pdfPath || !doc.pdfSha256)
    throw new HttpError(409, "Aucun PDF archivé pour ce budget additionnel", "NO_PDF");
  const buf = await readPdf(doc.pdfPath, doc.pdfSha256);
  const code = RUBRIQUE_META[doc.rubrique as BaRubrique].code;
  await audit(req, "DOC_PRINT", {
    entite: "Document",
    entiteId: id,
    details: { type: "BA", rubrique: doc.rubrique },
  });
  return { buf, filename: `BA-${code}-${doc.exercice}-${doc.etablissement.code}.pdf` };
}