import { Router } from "express";
import { requireAgent, requireAuth } from "../../common/middleware/auth.js";
import { getAccueil } from "./accueil.service.js";

const r = Router();
r.use(requireAuth(), requireAgent);

r.get("/", async (_req, res) => {
  res.json(await getAccueil());
});

export default r;