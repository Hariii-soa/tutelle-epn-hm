import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../../common/db/prisma.js";
import { HttpError } from "../../common/http/errors.js";
import { clearSession, setSession } from "../../common/auth/session.js";
import { requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { audit } from "../audit/audit.service.js";
import { toPublicUser } from "../users/users.service.js";
import { changePwdSchema, loginSchema } from "./auth.schemas.js";
import { changePassword, login } from "./auth.service.js";

const r = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new HttpError(429, "Trop de tentatives, réessayez plus tard", "RATE_LIMIT")),
});

r.post("/login", loginLimiter, validate(loginSchema), async (req, res) => {
  const { user, token, ttl } = await login(req, req.body);
  setSession(res, token, ttl, req.body.remember);
  res.json({ user: toPublicUser(user) });
});

r.post("/logout", requireAuth({ allowPwdPending: true }), async (req, res) => {
  await audit(req, "LOGOUT");
  clearSession(res);
  res.status(204).end();
});

r.get("/me", requireAuth({ allowPwdPending: true }), async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  res.json({ user: toPublicUser(user) });
});

r.post("/change-password", requireAuth({ allowPwdPending: true }), validate(changePwdSchema), async (req, res) => {
  const { user, token, ttl } = await changePassword(req, req.user!.id, req.body);
  setSession(res, token, ttl, false);
  res.json({ user: toPublicUser(user) });
});

export default r;