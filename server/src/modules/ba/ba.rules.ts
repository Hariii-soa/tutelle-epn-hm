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