import type { Section } from "../../generated/prisma/client.js";

// PROVISOIRE, en attente des règles de calcul :
// classes 6 et 7 = fonctionnement, autres classes = investissement.
export const sectionOf = (numero: number): Section => {
  const classe = String(numero)[0];
  return classe === "6" || classe === "7" ? "FONCTIONNEMENT" : "INVESTISSEMENT";
};