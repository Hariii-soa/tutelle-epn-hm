import { z } from "zod";

const NAME = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;

export const nameField = (label: string) =>
  z.string().trim().min(1, `${label} requis`).max(60, "60 caractères maximum")
    .regex(NAME, `${label} : lettres uniquement`);

export const emailField = z.string().trim().toLowerCase().max(254)
  .regex(/^[a-z0-9._%+-]+@gmail\.com$/, "Adresse Gmail requise (ex. nom@gmail.com)");

export const passwordField = z.string().min(8, "8 caractères minimum").max(128, "128 caractères maximum");

export const matriculeField = z.string().trim().toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/, "Matricule : 3 à 20 caractères alphanumériques");

export const PWD_MISMATCH = { path: ["confirmation"], message: "Les mots de passe ne correspondent pas" };