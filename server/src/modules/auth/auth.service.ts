import type { Request } from "express";
import { prisma } from "../../common/db/prisma.js";
import { blindIndex } from "../../common/crypto/aes-gcm.js";
import { hashPassword, verifyPassword } from "../../common/crypto/password.js";
import { HttpError } from "../../common/http/errors.js";
import { REMEMBER_TTL, SESSION_TTL, signToken } from "../../common/auth/session.js";
import { audit } from "../audit/audit.service.js";

const MAX_ATTEMPTS = 5;
const LOCK_MIN = 15;
const DUMMY_HASH = await hashPassword("timing-equalizer");

const mask = (v: string) => (v.includes("@") ? v.replace(/^(.).*(@.*)$/, "$1***$2") : v.slice(0, 50));

export async function login(
  req: Request,
  { identifiant, password, remember }: { identifiant: string; password: string; remember: boolean },
) {
  const user = await prisma.user.findUnique({
    where: identifiant.includes("@") ? { emailIdx: blindIndex(identifiant) } : { identifiant },
  });

  const deny = async (
    reason: string,
    status = 401,
    message = "Identifiants incorrects",
    code = "INVALID_CREDENTIALS",
  ): Promise<never> => {
    await audit(req, "LOGIN_ECHEC", { userId: user?.id, identifiant: mask(identifiant), details: { reason } });
    throw new HttpError(status, message, code);
  };

  if (!user) {
    await verifyPassword(DUMMY_HASH, password);
    return deny("unknown_user");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const min = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return deny("locked", 423, `Compte verrouillé. Réessayez dans ${min} min.`, "ACCOUNT_LOCKED");
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const n = user.failedAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data:
        n >= MAX_ATTEMPTS
          ? { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MIN * 60_000) }
          : { failedAttempts: n },
    });
    return deny("bad_password");
  }

  if (user.statut !== "ACTIF")
    return deny("inactive", 403, "Compte désactivé. Contactez l'administrateur.", "ACCOUNT_DISABLED");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await audit(req, "LOGIN", { userId: user.id });

  const ttl = remember ? REMEMBER_TTL : SESSION_TTL;
  return { user: updated, token: signToken(updated, ttl), ttl };
}

export async function changePassword(
  req: Request,
  userId: string,
  { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const invalid = (fields: Record<string, string>) => new HttpError(400, "Données invalides", "VALIDATION", fields);

  if (!(await verifyPassword(user.passwordHash, currentPassword)))
    throw invalid({ currentPassword: "Mot de passe actuel incorrect" });
  if (currentPassword === newPassword)
    throw invalid({ newPassword: "Le nouveau mot de passe doit être différent de l'actuel" });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword), mustChangePwd: false, tokenVersion: { increment: 1 } },
  });
  await audit(req, "PWD_CHANGE", { userId });
  return { user: updated, token: signToken(updated, SESSION_TTL), ttl: SESSION_TTL };
}