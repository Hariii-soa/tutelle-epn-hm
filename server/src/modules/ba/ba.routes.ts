import { Router } from "express";
import { requireAgent, requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import {
  addLigneBaSchema,
  archivesQuerySchema,
  idParams,
  ligneParams,
  modifierBaSchema,
  ouvrirBaSchema,
  type ArchivesQuery,
} from "./ba.schemas.js";
import { addLigne, archive, consulter, listArchives, modifier, ouvrir, removeLigne } from "./ba.service.js";

const r = Router();
r.use(requireAuth(), requireAgent);

r.post("/ouvrir", validate(ouvrirBaSchema), async (req, res) => {
  res.json(await ouvrir(req, req.body));
});

r.get("/archives", validate(archivesQuerySchema, "query"), async (_req, res) => {
  res.json(await listArchives(res.locals.query as ArchivesQuery));
});

r.get("/:id", validate(idParams, "params"), async (req, res) => {
  res.json(await consulter(req.params.id as string));
});

r.post("/:id/lignes", validate(idParams, "params"), validate(addLigneBaSchema), async (req, res) => {
  res.status(201).json(await addLigne(req, req.params.id as string, req.body));
});

r.patch("/:id/lignes", validate(idParams, "params"), validate(modifierBaSchema), async (req, res) => {
  res.json(await modifier(req, req.params.id as string, req.body.lignes));
});

r.delete("/:id/lignes/:ligneId", validate(ligneParams, "params"), async (req, res) => {
  res.json(await removeLigne(req, req.params.id as string, req.params.ligneId as string));
});

r.post("/:id/archive", validate(idParams, "params"), async (req, res) => {
  res.json(await archive(req, req.params.id as string));
});

export default r;