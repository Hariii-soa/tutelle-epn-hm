import { Router } from "express";
import { requireAgent, requireAuth } from "../../common/middleware/auth.js";
import { getDashboard } from "./dashboard.service.js";

const r = Router();
r.use(requireAuth(), requireAgent);

r.get("/", async (_req, res) => {
  res.json(await getDashboard());
});

export default r;