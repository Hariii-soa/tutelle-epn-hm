import { z } from "zod";
import { emailField, matriculeField, nameField, passwordField, PWD_MISMATCH } from "../../common/validation/rules.js";

export const createUserSchema = z
  .object({
    nom: nameField("Nom"),
    prenoms: nameField("Prénoms"),
    matricule: matriculeField,
    email: emailField,
    password: passwordField,
    confirmation: z.string(),
  })
  .refine((d) => d.password === d.confirmation, PWD_MISMATCH);

export const resetPwdSchema = z
  .object({ password: passwordField, confirmation: z.string() })
  .refine((d) => d.password === d.confirmation, PWD_MISMATCH);

export const statutSchema = z.object({ statut: z.enum(["ACTIF", "INACTIF"]) });
export const idParams = z.object({ id: z.uuid() });