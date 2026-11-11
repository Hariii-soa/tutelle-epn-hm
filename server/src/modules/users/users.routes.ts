import { Router } from "express";
import { requireAdmin, requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { createUserSchema, idParams, resetPwdSchema, statutSchema } from "./users.schemas.js";
import { createUser, listUsers, resetPassword, setStatut } from "./users.service.js";

const r = Router();
r.use(requireAuth(), requireAdmin);

r.get("/", async (_req, res) => {
  res.json({ users: await listUsers() });
});

r.post("/", validate(createUserSchema), async (req, res) => {
  res.status(201).json({ user: await createUser(req, req.body) });
});

r.patch("/:id/statut", validate(idParams, "params"), validate(statutSchema), async (req, res) => {
  res.json({ user: await setStatut(req, req.params.id as string, req.body.statut) });
});

r.post("/:id/reset-password", validate(idParams, "params"), validate(resetPwdSchema), async (req, res) => {
  await resetPassword(req, req.params.id as string, req.body.password);
  res.status(204).end();
});

export default r;