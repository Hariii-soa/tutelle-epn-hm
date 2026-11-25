import { api } from "../../common/api";

export type AdminStats = { utilisateurs: number; comptesActifs: number; connexionsAujourdhui: number };
export type Connexion = { id: string; at: string; ip: string | null; matricule: string; nom: string; prenoms: string };

export const getStats = () => api<AdminStats>("/audit/stats");
export const getConnexions = () => api<{ connexions: Connexion[] }>("/audit/connexions").then((r) => r.connexions);
