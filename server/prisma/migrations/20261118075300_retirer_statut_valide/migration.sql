/*
  Warnings:

  - The values [VALIDE] on the enum `DocStatut` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocStatut_new" AS ENUM ('BROUILLON', 'ARCHIVE');
ALTER TABLE "public"."documents" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "documents" ALTER COLUMN "statut" TYPE "DocStatut_new" USING ("statut"::text::"DocStatut_new");
ALTER TYPE "DocStatut" RENAME TO "DocStatut_old";
ALTER TYPE "DocStatut_new" RENAME TO "DocStatut";
DROP TYPE "public"."DocStatut_old";
ALTER TABLE "documents" ALTER COLUMN "statut" SET DEFAULT 'BROUILLON';
COMMIT;
