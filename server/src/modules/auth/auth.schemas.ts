import { z } from "zod";
import { passwordField, PWD_MISMATCH } from "../../common/validation/rules.js";

export const loginSchema = z.object({
  identifiant: z.string().trim().min(1, "Champ requis").max(254),
  password: z.string().min(1, "Mot de passe requis").max(128),
  remember: z.boolean().default(false),
});

export const changePwdSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: passwordField,
    confirmation: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmation, PWD_MISMATCH);