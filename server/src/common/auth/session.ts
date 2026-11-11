import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";

export const COOKIE = "tutelle_session";
export const SESSION_TTL = 8 * 3600; // s
export const REMEMBER_TTL = 7 * 24 * 3600; // s

const cookieOpts: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api",
};

export const signToken = (u: { id: string; tokenVersion: number }, ttl: number) =>
  jwt.sign({ tv: u.tokenVersion }, env.JWT_SECRET, { algorithm: "HS256", subject: u.id, expiresIn: ttl });

export const readToken = (t: string): { sub: string; tv: number } | null => {
  try {
    const p = jwt.verify(t, env.JWT_SECRET, { algorithms: ["HS256"] });
    return typeof p === "object" && p.sub && typeof p.tv === "number" ? { sub: p.sub, tv: p.tv } : null;
  } catch {
    return null;
  }
};

export const setSession = (res: Response, token: string, ttl: number, persistent: boolean) =>
  res.cookie(COOKIE, token, persistent ? { ...cookieOpts, maxAge: ttl * 1000 } : cookieOpts);

export const clearSession = (res: Response) => res.clearCookie(COOKIE, cookieOpts);