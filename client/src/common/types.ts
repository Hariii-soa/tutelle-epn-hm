export type Role = "ADMIN" | "AGENT";
export type UserStatut = "ACTIF" | "INACTIF";

export interface User {
  id: string;
  identifiant: string | null;
  nom: string;
  prenoms: string;
  email: string | null;
  matricule: string;
  role: Role;
  statut: UserStatut;
  mustChangePwd: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
