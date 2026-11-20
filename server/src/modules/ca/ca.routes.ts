import { requireAgent, requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { Router, type RequestHandler } from "express";

import {
  addLignesSchema,
  archivesQuerySchema,
  idParams,
  ligneParams,
  ouvrirSchema,
  type ArchivesQuery,
} from "./ca.schemas.js";
import { addLignes, archive, consulter, listArchives, ouvrir, pdf, removeLigne } from "./ca.service.js";

const r = Router();
r.use(requireAuth(), requireAgent);

r.post("/ouvrir", validate(ouvrirSchema), async (req, res) => {
  res.json(await ouvrir(req, req.body));
});

r.get("/archives", validate(archivesQuerySchema, "query"), async (_req, res) => {
  res.json(await listArchives(res.locals.query as ArchivesQuery));
});

r.get("/:id", validate(idParams, "params"), async (req, res) => {
  res.json(await consulter(req.params.id as string));
});

const sendPdf = (disposition: "attachment" | "inline", op: "pdf" | "impression"): RequestHandler =>
  async (req, res) => {
    const { buffer, filename } = await pdf(req, req.params.id as string, op);
    res
      .type("application/pdf")
      .set("Content-Disposition", `${disposition}; filename="${filename}"`)
      .send(buffer);
  };

r.get("/:id/pdf", validate(idParams, "params"), sendPdf("attachment", "pdf"));
r.get("/:id/impression", validate(idParams, "params"), sendPdf("inline", "impression"));
r.post("/:id/lignes", validate(idParams, "params"), validate(addLignesSchema), async (req, res) => {
  res.status(201).json(await addLignes(req, req.params.id as string, req.body.lignes));
});

r.delete("/:id/lignes/:ligneId", validate(ligneParams, "params"), async (req, res) => {
  res.json(await removeLigne(req, req.params.id as string, req.params.ligneId as string));
});

r.post("/:id/etat-synthese/archive", validate(idParams, "params"), async (req, res) => {
  res.json(await archive(req, req.params.id as string));
});

export default r;