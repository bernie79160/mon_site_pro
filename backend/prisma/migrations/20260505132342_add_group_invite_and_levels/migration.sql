/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `groupes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `groupes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `groupes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "groupes" ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "niveauExcel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "niveauPowerpoint" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "niveauWord" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "groupes_inviteCode_key" ON "groupes"("inviteCode");
