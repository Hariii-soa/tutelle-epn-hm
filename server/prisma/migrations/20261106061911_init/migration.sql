-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "UserStatut" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PCOP', 'PCG');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('CA', 'BA');

-- CreateEnum
CREATE TYPE "DocStatut" AS ENUM ('BROUILLON', 'ARCHIVE', 'VALIDE');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('FONCTIONNEMENT', 'INVESTISSEMENT');

-- CreateEnum
CREATE TYPE "Nature" AS ENUM ('DEPENSE', 'RECETTE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGIN_ECHEC', 'LOGOUT', 'USER_CREATE', 'USER_STATUT', 'USER_RESET_PWD', 'DOC_SAVE', 'DOC_ARCHIVE', 'BA_MODIFY', 'DOC_PRINT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "identifiant" TEXT,
    "emailIdx" TEXT,
    "emailEnc" TEXT,
    "nomEnc" TEXT NOT NULL,
    "prenomsEnc" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "statut" "UserStatut" NOT NULL DEFAULT 'ACTIF',
    "mustChangePwd" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etablissements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_comptes" (
    "id" SERIAL NOT NULL,
    "plan" "PlanType" NOT NULL,
    "numero" INTEGER NOT NULL,
    "intitule" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL,

    CONSTRAINT "plan_comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "etablissementId" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "type" "DocType" NOT NULL,
    "statut" "DocStatut" NOT NULL DEFAULT 'BROUILLON',
    "pdfPath" TEXT,
    "pdfSha256" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_ca" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "nature" "Nature" NOT NULL,
    "section" "Section" NOT NULL,
    "compteId" INTEGER NOT NULL,
    "creditsOuvertsN1" BIGINT NOT NULL DEFAULT 0,
    "realisation" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "lignes_ca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_ba" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "section" "Section" NOT NULL,
    "compteId" INTEGER NOT NULL,
    "budgetPrimitif" BIGINT NOT NULL DEFAULT 0,
    "excedent" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "lignes_ba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "identifiant" TEXT,
    "entite" TEXT,
    "entiteId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_identifiant_key" ON "users"("identifiant");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailIdx_key" ON "users"("emailIdx");

-- CreateIndex
CREATE UNIQUE INDEX "users_matricule_key" ON "users"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_code_key" ON "etablissements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_comptes_plan_numero_key" ON "plan_comptes"("plan", "numero");

-- CreateIndex
CREATE INDEX "documents_exercice_type_statut_idx" ON "documents"("exercice", "type", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "documents_etablissementId_exercice_type_key" ON "documents"("etablissementId", "exercice", "type");

-- CreateIndex
CREATE UNIQUE INDEX "lignes_ca_documentId_nature_compteId_key" ON "lignes_ca"("documentId", "nature", "compteId");

-- CreateIndex
CREATE UNIQUE INDEX "lignes_ba_documentId_compteId_key" ON "lignes_ba"("documentId", "compteId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_ca" ADD CONSTRAINT "lignes_ca_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_ca" ADD CONSTRAINT "lignes_ca_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "plan_comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_ba" ADD CONSTRAINT "lignes_ba_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_ba" ADD CONSTRAINT "lignes_ba_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "plan_comptes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
