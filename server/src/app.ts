import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { HttpError } from "./common/http/errors.js";
import { errorHandler } from "./common/middleware/error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import accueilRoutes from "./modules/accueil/accueil.routes.js";
import etablissementsRoutes from "./modules/etablissements/etablissements.routes.js";
import caRoutes from "./modules/ca/ca.routes.js";
import baRoutes from "./modules/ba/ba.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";


const app = express();
app.disable("x-powered-by");
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/accueil", accueilRoutes);
app.use("/api/etablissements", etablissementsRoutes);
app.use("/api/ca", caRoutes);
app.use("/api/ba", baRoutes);
app.use("/api/dashboard", dashboardRoutes)

app.use((_req, _res, next) => next(new HttpError(404, "Ressource introuvable", "NOT_FOUND")));
app.use(errorHandler);

export default app;