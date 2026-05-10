-- CreateTable
CREATE TABLE "tentative_reponses" (
    "id" TEXT NOT NULL,
    "tentativeId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reponse" TEXT,
    "estCorrecte" BOOLEAN,
    "pointsObt" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "tentative_reponses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentative_reponses_tentativeId_idx" ON "tentative_reponses"("tentativeId");

-- CreateIndex
CREATE UNIQUE INDEX "tentative_reponses_tentativeId_questionId_key" ON "tentative_reponses"("tentativeId", "questionId");

-- AddForeignKey
ALTER TABLE "tentative_reponses" ADD CONSTRAINT "tentative_reponses_tentativeId_fkey" FOREIGN KEY ("tentativeId") REFERENCES "tentatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentative_reponses" ADD CONSTRAINT "tentative_reponses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
