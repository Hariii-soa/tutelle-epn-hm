import type { Request } from "express";
import type { AuditAction, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../common/db/prisma.js";
import { decrypt } from "../../common/crypto/aes-gcm.js";
import { startOfTodayMg } from "../../common/time.js";

type AuditData = {
  userId?: string | null;
  identifiant?: string;
  entite?: string;
  entiteId?: string;
  details?: Prisma.InputJsonValue;
};

export const audit = (req: Request, action: AuditAction, d: AuditData = {}) =>
  prisma.auditLog.create({
    data: {
      action,
      userId: d.userId ?? req.user?.id ?? null,
      identifiant: d.identifiant,
      entite: d.entite,
      entiteId: d.entiteId,
      details: d.details,
      ip: req.ip,
      userAgent: req.get("user-agent")?.slice(0, 255),
    },
  });

export async function adminStats() {
  const [utilisateurs, comptesActifs, connexionsAujourdhui] = await Promise.all([
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "AGENT", statut: "ACTIF" } }),
    prisma.auditLog
      .groupBy({
        by: ["userId"],
        where: { action: "LOGIN", createdAt: { gte: startOfTodayMg() }, user: { role: "AGENT" } },
      })
      .then((r) => r.length),
  ]);
  return { utilisateurs, comptesActifs, connexionsAujourdhui };
}

export async function connexionsDuJour() {
  const rows = await prisma.auditLog.findMany({
    where: { action: "LOGIN", createdAt: { gte: startOfTodayMg() }, user: { role: "AGENT" } },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return rows.map((r) => ({
    id: r.id,
    at: r.createdAt,
    ip: r.ip,
    matricule: r.user!.matricule,
    nom: decrypt(r.user!.nomEnc),
    prenoms: decrypt(r.user!.prenomsEnc),
  }));
}