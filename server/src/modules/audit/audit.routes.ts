import { Router } from "express";
import { requireAdmin, requireAuth } from "../../common/middleware/auth.js";
import { adminStats, connexionsDuJour } from "./audit.service.js";

const r = Router();
r.use(requireAuth(), requireAdmin);

r.get("/stats", async (_req, res) => {
  res.json(await adminStats());
});
r.get("/connexions", async (_req, res) => {
  res.json({ connexions: await connexionsDuJour() });
});

export default r;