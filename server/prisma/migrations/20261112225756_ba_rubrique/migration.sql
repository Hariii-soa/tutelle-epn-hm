/*
  Warnings:

  - A unique constraint covering the columns `[etablissementId,exercice,type,rubrique]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Rubrique" AS ENUM ('GLOBAL', 'RECETTE_FONCTIONNEMENT', 'RECETTE_INVESTISSEMENT', 'DEPENSE_FONCTIONNEMENT', 'DEPENSE_INVESTISSEMENT');

-- DropIndex
DROP INDEX "documents_etablissementId_exercice_type_key";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "rubrique" "Rubrique" NOT NULL DEFAULT 'GLOBAL';

-- AlterTable
ALTER TABLE "lignes_ba" ADD COLUMN     "budgetAdditionnel" BIGINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "documents_etablissementId_exercice_type_rubrique_key" ON "documents"("etablissementId", "exercice", "type", "rubrique");
