/*
  Warnings:

  - A unique constraint covering the columns `[eleveCode]` on the table `eleves` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "eleves" ADD COLUMN     "eleveCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "eleves_eleveCode_key" ON "eleves"("eleveCode");
