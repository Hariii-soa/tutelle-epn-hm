import { api } from "../../common/api";
import type { User, UserStatut } from "../../common/types";

export type NewUser = {
  nom: string;
  prenoms: string;
  matricule: string;
  email: string;
  password: string;
  confirmation: string;
};

export const listUsers = () => api<{ users: User[] }>("/users").then((r) => r.users);
export const createUser = (body: NewUser) => api<{ user: User }>("/users", { method: "POST", body }).then((r) => r.user);
export const setStatut = (id: string, statut: UserStatut) =>
  api<{ user: User }>(`/users/${id}/statut`, { method: "PATCH", body: { statut } }).then((r) => r.user);
export const resetPassword = (id: string, password: string, confirmation: string) =>
  api<void>(`/users/${id}/reset-password`, { method: "POST", body: { password, confirmation } });
