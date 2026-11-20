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
export type CalculCote = Record<"sousTotal" | "previsionnel" | "resultatR1" | "total1", Montants>;
export type EtatSection = {
  section: Section;
  depenses: LigneView[];
  recettes: LigneView[];
  calcul: { depenses: CalculCote; recettes: CalculCote };
};

const SECTIONS: Section[] = ["FONCTIONNEMENT", "INVESTISSEMENT"];
const vide = (): Montants => ({ credits: null, realisations: null });
const coteVide = (): CalculCote => ({
  sousTotal: vide(),
  previsionnel: vide(),
  resultatR1: vide(),
  total1: vide(),
});

// PROVISOIRE : en attente des règles de calcul (null affiché « — »)
const calculer = (_depenses: LigneView[], _recettes: LigneView[]) => ({
  depenses: coteVide(),
  recettes: coteVide(),
});

export const buildEtat = (lignes: LigneView[]): EtatSection[] =>
  SECTIONS.map((section) => {
    const depenses = lignes.filter((l) => l.section === section && l.nature === "DEPENSE");
    const recettes = lignes.filter((l) => l.section === section && l.nature === "RECETTE");
    return { section, depenses, recettes, calcul: calculer(depenses, recettes) };
  });