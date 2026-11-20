import { z } from "zod";
import { currentYearMg } from "../../common/time.js";

const MAX_MONTANT = 9_999_999_999_999; // Ar

const montant = z
  .number("Montant requis")
  .int("Montant entier requis")
  .min(0, "Montant positif requis")
  .max(MAX_MONTANT, "Montant trop élevé");

export const ouvrirSchema = z.object({
  etablissementId: z.uuid(),
  exercice: z
    .number("Année requise")
    .int("Année invalide")
    .min(2000, "Année invalide")
    .refine((y) => y <= currentYearMg(), "L'exercice ne peut pas être dans le futur"),
});

const ligneSchema = z.object({
  nature: z.enum(["DEPENSE", "RECETTE"]),
  compteId: z.number().int().positive(),
  creditsOuvertsN1: montant,
  realisation: montant,
});
export type LigneInput = z.infer<typeof ligneSchema>;

// Un « Ajouter » = au plus une dépense + une recette
export const addLignesSchema = z
  .object({ lignes: z.array(ligneSchema).min(1).max(2) })
  .refine((d) => new Set(d.lignes.map((l) => l.nature)).size === d.lignes.length, {
    path: ["lignes"],
    message: "Une seule ligne par nature",
  });

export const archivesQuerySchema = z.object({
  etablissementId: z.uuid(),
  exercice: z.coerce.number().int().min(2000).optional(),
});
export type ArchivesQuery = z.infer<typeof archivesQuerySchema>;

export const idParams = z.object({ id: z.uuid() });
export const ligneParams = z.object({ id: z.uuid(), ligneId: z.uuid() });