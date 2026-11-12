import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";
import { HttpError } from "../http/errors.js";
import { COOKIE, readToken } from "../auth/session.js";

export const requireAuth =
  (opts: { allowPwdPending?: boolean } = {}): RequestHandler =>
  async (req, _res, next) => {
    const claims = req.cookies?.[COOKIE] ? readToken(req.cookies[COOKIE]) : null;
    const user = claims && (await prisma.user.findUnique({ where: { id: claims.sub } }));
    if (!claims || !user || user.statut !== "ACTIF" || user.tokenVersion !== claims.tv)
      throw new HttpError(401, "Session expirée, veuillez vous reconnecter", "UNAUTHENTICATED");
    if (user.mustChangePwd && !opts.allowPwdPending)
      throw new HttpError(403, "Vous devez changer votre mot de passe", "PASSWORD_CHANGE_REQUIRED");
    req.user = { id: user.id, role: user.role, mustChangePwd: user.mustChangePwd };
    next();
  };

export const requireAdmin: RequestHandler = (req, _res, next) =>
  req.user?.role === "ADMIN" ? next() : next(new HttpError(403, "Accès réservé à l'administrateur", "FORBIDDEN"));