import { listEtablissements } from "../etablissements/etablissements.service.js";

const MENUS = [
  { key: "accueil", label: "Accueil", path: "/accueil" },
  { key: "dashboard", label: "Tableau de bord", path: "/tableau-de-bord" },
] as const;

export async function getAccueil() {
  return { menus: MENUS, etablissements: await listEtablissements() };
}