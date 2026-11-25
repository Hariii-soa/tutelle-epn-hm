import type { Nature, Section } from "../../generated/prisma/client.js";

export const BA_RUBRIQUES = [
  "RECETTE_FONCTIONNEMENT",
  "RECETTE_INVESTISSEMENT",
  "DEPENSE_FONCTIONNEMENT",
  "DEPENSE_INVESTISSEMENT",
] as const;
export type BaRubrique = (typeof BA_RUBRIQUES)[number];

export const RUBRIQUE_META: Record<
  BaRubrique,
  { label: string; code: "RF" | "RI" | "DF" | "DI"; nature: Nature; section: Section }
> = {
  RECETTE_FONCTIONNEMENT: { label: "Recette de fonctionnement", code: "RF", nature: "RECETTE", section: "FONCTIONNEMENT" },
  RECETTE_INVESTISSEMENT: { label: "Recette d'investissement", code: "RI", nature: "RECETTE", section: "INVESTISSEMENT" },
  DEPENSE_FONCTIONNEMENT: { label: "Dépense de fonctionnement", code: "DF", nature: "DEPENSE", section: "FONCTIONNEMENT" },
  DEPENSE_INVESTISSEMENT: { label: "Dépense d'investissement", code: "DI", nature: "DEPENSE", section: "INVESTISSEMENT" },
};

export const SOMME_MSG = "Le budget additionnel doit être égal au budget primitif + l'excédent";

export const sommeValide = (l: { budgetPrimitif: number; excedent: number; budgetAdditionnel: number }) =>
  l.budgetPrimitif + l.excedent === l.budgetAdditionnel;

export type ResultatEquilibre = "EGAL" | "RECETTES_SUPERIEURES" | "RECETTES_INFERIEURES";

export const resultatOf = (ecart: number): ResultatEquilibre =>
  ecart === 0 ? "EGAL" : ecart > 0 ? "RECETTES_SUPERIEURES" : "RECETTES_INFERIEURES";