-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ELEVE', 'FORMATEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProgressState" AS ENUM ('LOCKED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('QCM', 'PRATIQUE', 'TOSA');

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ELEVE',
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "groupeId" TEXT,
    "consentements" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "formateurId" TEXT,
    "session" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "categorie" TEXT,
    "sourcePath" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "type" "TestType" NOT NULL,
    "niveau" TEXT,
    "dureeSec" INTEGER,
    "bareme" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "intitule" TEXT NOT NULL,
    "options" JSONB,
    "bonneReponse" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "competence" TEXT,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentatives" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "statut" TEXT NOT NULL DEFAULT 'started',
    "corrigePar" TEXT,
    "commentaire" TEXT,

    CONSTRAINT "tentatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progressions" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "etat" "ProgressState" NOT NULL DEFAULT 'LOCKED',
    "tempsSec" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "typing_sessions" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "langue" TEXT NOT NULL DEFAULT 'fr',
    "dureeSec" INTEGER NOT NULL,
    "wpm" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "errors" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "typing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eleves_email_key" ON "eleves"("email");

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "modules_ordre_key" ON "modules"("ordre");

-- CreateIndex
CREATE INDEX "tests_moduleId_idx" ON "tests"("moduleId");

-- CreateIndex
CREATE INDEX "questions_testId_idx" ON "questions"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_testId_ordre_key" ON "questions"("testId", "ordre");

-- CreateIndex
CREATE INDEX "tentatives_eleveId_idx" ON "tentatives"("eleveId");

-- CreateIndex
CREATE INDEX "tentatives_testId_idx" ON "tentatives"("testId");

-- CreateIndex
CREATE INDEX "progressions_eleveId_idx" ON "progressions"("eleveId");

-- CreateIndex
CREATE INDEX "progressions_moduleId_idx" ON "progressions"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "progressions_eleveId_moduleId_key" ON "progressions"("eleveId", "moduleId");

-- CreateIndex
CREATE INDEX "typing_sessions_eleveId_idx" ON "typing_sessions"("eleveId");

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentatives" ADD CONSTRAINT "tentatives_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentatives" ADD CONSTRAINT "tentatives_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progressions" ADD CONSTRAINT "progressions_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progressions" ADD CONSTRAINT "progressions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_sessions" ADD CONSTRAINT "typing_sessions_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
