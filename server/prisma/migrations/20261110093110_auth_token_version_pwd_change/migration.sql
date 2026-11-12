-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PWD_CHANGE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;
