import type { ErrorRequestHandler } from "express";
import { HttpError } from "../http/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { code: "BAD_JSON", message: "Corps de requête invalide" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Erreur interne du serveur" } });
};