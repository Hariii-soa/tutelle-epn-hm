import { z } from "zod";
import { currentYearMg } from "../../common/time.js";
import { BA_RUBRIQUES, SOMME_MSG, sommeValide } from "./ba.rules.js";

const MAX_MONTANT = 9_999_999_999_999; // Ar

const montant = z
  .number("Montant requis")
  .int("Montant entier requis")
  .min(0, "Montant positif requis")
  .max(MAX_MONTANT, "Montant trop élevé");

export const ouvrirBaSchema = z.object({
  etablissementId: z.uuid(),
  exercice: z
    .number("Année requise")
    .int("Année invalide")
    .min(2000, "Année invalide")
    .refine((y) => y <= currentYearMg(), "L'exercice ne peut pas être dans le futur"),
  rubrique: z.enum(BA_RUBRIQUES, "Section requise"),
});

export const addLigneBaSchema = z
  .object({
    compteId: z.number("Compte requis").int().positive(),
    budgetPrimitif: montant,
    excedent: montant,
    budgetAdditionnel: montant,
  })
  .refine(sommeValide, { path: ["budgetAdditionnel"], message: SOMME_MSG });
export type LigneBaInput = z.infer<typeof addLigneBaSchema>;

export const idParams = z.object({ id: z.uuid() });
export const ligneParams = z.object({ id: z.uuid(), ligneId: z.uuid() });

export const archivesQuerySchema = z.object({
  etablissementId: z.uuid(),
  exercice: z.coerce.number().int().min(2000).optional(),
});
export type ArchivesQuery = z.infer<typeof archivesQuerySchema>;

const ligneModifSchema = z
  .object({
    id: z.uuid(),
    budgetPrimitif: montant,
    excedent: montant,
    budgetAdditionnel: montant,
  })
  .refine(sommeValide, { path: ["budgetAdditionnel"], message: SOMME_MSG });
export type LigneModifInput = z.infer<typeof ligneModifSchema>;

export const modifierBaSchema = z
  .object({ lignes: z.array(ligneModifSchema).min(1).max(100) })
  .refine((d) => new Set(d.lignes.map((l) => l.id)).size === d.lignes.length, {
    path: ["lignes"],
    message: "Ligne en double",
  });

export const equilibreQuerySchema = z.object({
  etablissementId: z.uuid(),
  exercice: z.coerce
    .number("Année requise")
    .int("Année invalide")
    .min(2000, "Année invalide")
    .refine((y) => y <= currentYearMg(), "L'exercice ne peut pas être dans le futur"),
});
export type EquilibreQuery = z.infer<typeof equilibreQuerySchema>;

const texteOpt = z
  .string()
  .trim()
  .max(100, "100 caractères maximum")
  .transform((v) => v || null);

export const enteteBaSchema = z.object({ mission: texteOpt, programme: texteOpt });
export type EnteteBaInput = z.infer<typeof enteteBaSchema>;