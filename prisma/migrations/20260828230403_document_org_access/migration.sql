-- CreateEnum
CREATE TYPE "OrgDocAccess" AS ENUM ('EDIT', 'VIEW');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "orgAccess" "OrgDocAccess" NOT NULL DEFAULT 'EDIT';
