import { prisma } from "../../common/db/prisma.js";
import { HttpError } from "../../common/http/errors.js";

const select = { id: true, code: true, nom: true, plan: true } as const;

export const listEtablissements = () =>
  prisma.etablissement.findMany({ where: { actif: true }, orderBy: { ordre: "asc" }, select });

export async function getEtablissement(id: string) {
  const e = await prisma.etablissement.findFirst({ where: { id, actif: true }, select });
  if (!e) throw new HttpError(404, "Établissement introuvable", "NOT_FOUND");
  return e;
}