import type { Request } from "express";
import type { User, UserStatut } from "../../generated/prisma/client.js";
import { prisma } from "../../common/db/prisma.js";
import { blindIndex, decrypt, encrypt } from "../../common/crypto/aes-gcm.js";
import { hashPassword } from "../../common/crypto/password.js";
import { HttpError } from "../../common/http/errors.js";
import { audit } from "../audit/audit.service.js";

export const toPublicUser = (u: User) => ({
  id: u.id,
  identifiant: u.identifiant,
  nom: decrypt(u.nomEnc),
  prenoms: decrypt(u.prenomsEnc),
  email: u.emailEnc ? decrypt(u.emailEnc) : null,
  matricule: u.matricule,
  role: u.role,
  statut: u.statut,
  mustChangePwd: u.mustChangePwd,
  lastLoginAt: u.lastLoginAt,
  createdAt: u.createdAt,
});

const getAgent = async (id: string) => {
  const u = await prisma.user.findFirst({ where: { id, role: "AGENT" } });
  if (!u) throw new HttpError(404, "Utilisateur introuvable", "NOT_FOUND");
  return u;
};

export async function listUsers() {
  const users = await prisma.user.findMany({ where: { role: "AGENT" }, orderBy: { createdAt: "desc" } });
  return users.map(toPublicUser);
}

type NewUser = { nom: string; prenoms: string; matricule: string; email: string; password: string };

export async function createUser(req: Request, d: NewUser) {
  const emailIdx = blindIndex(d.email);
  const dup = await prisma.user.findFirst({
    where: { OR: [{ emailIdx }, { matricule: d.matricule }] },
    select: { emailIdx: true },
  });
  const conflict = (fields?: Record<string, string>) =>
    new HttpError(409, "Utilisateur déjà existant", "CONFLICT", fields);
  if (dup)
    throw conflict(
      dup.emailIdx === emailIdx
        ? { email: "Cette adresse est déjà utilisée" }
        : { matricule: "Ce matricule est déjà utilisé" },
    );

  const user = await prisma.user
    .create({
      data: {
        emailIdx,
        emailEnc: encrypt(d.email),
        nomEnc: encrypt(d.nom),
        prenomsEnc: encrypt(d.prenoms),
        matricule: d.matricule,
        passwordHash: await hashPassword(d.password),
      },
    })
    .catch((e) => {
      throw e?.code === "P2002" ? conflict() : e;
    });

  await audit(req, "USER_CREATE", { entite: "User", entiteId: user.id, details: { matricule: user.matricule } });
  return toPublicUser(user);
}

export async function setStatut(req: Request, id: string, statut: UserStatut) {
  await getAgent(id);
  const user = await prisma.user.update({
    where: { id },
    data:
      statut === "INACTIF"
        ? { statut, tokenVersion: { increment: 1 } }
        : { statut, failedAttempts: 0, lockedUntil: null },
  });
  await audit(req, "USER_STATUT", { entite: "User", entiteId: id, details: { statut } });
  return toPublicUser(user);
}

export async function resetPassword(req: Request, id: string, password: string) {
  await getAgent(id);
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePwd: true,
      failedAttempts: 0,
      lockedUntil: null,
      tokenVersion: { increment: 1 },
    },
  });
  await audit(req, "USER_RESET_PWD", { entite: "User", entiteId: id });
}