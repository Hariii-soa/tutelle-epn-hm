import type { Nature, Section } from "../../generated/prisma/client.js";

export type LigneView = {
  id: string;
  nature: Nature;
  section: Section;
  compteId: number;
  numero: number;
  intitule: string;
  creditsOuvertsN1: number; // informatif, sans impact sur le calcul
  realisation: number;
};

export type Montants = { credits: number | null; realisations: number | null };
export type CalculCote = Record<"sousTotal" | "resultatR1" | "total", Montants>;
export type EtatSection = {
  section: Section;
  numeroTotal: 1 | 2;
  depenses: LigneView[];
  recettes: LigneView[];
  calcul: { depenses: CalculCote; recettes: CalculCote };
};

const SECTIONS: Section[] = ["FONCTIONNEMENT", "INVESTISSEMENT"];
const NUMERO_TOTAL: Record<Section, 1 | 2> = { FONCTIONNEMENT: 1, INVESTISSEMENT: 2 };

const sum = (ls: LigneView[], k: "creditsOuvertsN1" | "realisation") => ls.reduce((s, l) => s + l[k], 0);

// r1 : montant du résultat R1 placé de ce côté (null si aucun)
const cote = (ls: LigneView[], r1: number | null): CalculCote => {
  const sousTotal: Montants = { credits: sum(ls, "creditsOuvertsN1"), realisations: sum(ls, "realisation") };
  return {
    sousTotal,
    resultatR1: { credits: null, realisations: r1 },
    total: { credits: sousTotal.credits, realisations: (sousTotal.realisations ?? 0) + (r1 ?? 0) },
  };
};

const calculer = (depenses: LigneView[], recettes: LigneView[]) => {
  const ecart = sum(recettes, "realisation") - sum(depenses, "realisation"); // recouvrement − mandatement
  return {
    depenses: cote(depenses, ecart > 0 ? ecart : null), // résultat bénéficiaire R1
    recettes: cote(recettes, ecart < 0 ? -ecart : null), // résultat déficitaire R1 (valeur absolue)
  };
};
export const buildEtat = (lignes: LigneView[]): EtatSection[] =>
  SECTIONS.map((section) => {
    const depenses = lignes.filter((l) => l.section === section && l.nature === "DEPENSE");
    const recettes = lignes.filter((l) => l.section === section && l.nature === "RECETTE");
    return { section, numeroTotal: NUMERO_TOTAL[section], depenses, recettes, calcul: calculer(depenses, recettes) };
  });