import { Router } from "express";
import { requireAgent, requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { idParams } from "./etablissements.schemas.js";
import { getEtablissement, listEtablissements } from "./etablissements.service.js";

const r = Router();
r.use(requireAuth(), requireAgent);

r.get("/", async (_req, res) => {
  res.json({ etablissements: await listEtablissements() });
});

r.get("/:id", validate(idParams, "params"), async (req, res) => {
  res.json({ etablissement: await getEtablissement(req.params.id as string) });
});

export default r;