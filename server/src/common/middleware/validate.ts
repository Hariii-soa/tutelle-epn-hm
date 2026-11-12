import type { RequestHandler } from "express";
import type { z } from "zod";
import { HttpError } from "../http/errors.js";

const fieldErrors = (e: z.ZodError) => {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[i.path.join(".") || "_"] ??= i.message;
  return out;
};

export const validate =
  (schema: z.ZodType, source: "body" | "params" = "body"): RequestHandler =>
  (req, _res, next) => {
    const r = schema.safeParse(req[source]);
    if (!r.success) return next(new HttpError(400, "Données invalides", "VALIDATION", fieldErrors(r.error)));
    if (source === "body") req.body = r.data;
    next();
  };