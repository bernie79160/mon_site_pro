/**
 * routes/tentatives.js
 * POST /tentatives/:id/submit  → soumet les réponses, calcule le score
 * GET  /tentatives/me          → historique de l'élève connecté
 */
'use strict';
const { authenticate } = require('../middlewares/auth');

async function tentativesRoutes(app) {
  /**
   * POST /tentatives/:id/submit
   * Body: { reponses: [{ questionId, reponse }] }
   * Calcule le score QCM, enregistre TentativeReponse, ferme la tentative.
   */
  app.post('/:id/submit', {
    preHandler: [authenticate]
  }, async (req, reply) => {
    const { id } = req.params;
    const eleveId = req.user.sub;
    const { reponses } = req.body ?? {};

    if (!Array.isArray(reponses) || reponses.length === 0) {
      return reply.status(400).send({ error: 'reponses[] est requis' });
    }

    // Charger la tentative avec ses questions
    const tentative = await app.prisma.tentative.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            questions: true
          }
        }
      }
    });

    if (!tentative) return reply.status(404).send({ error: 'Tentative introuvable' });
    if (tentative.eleveId !== eleveId) return reply.status(403).send({ error: 'Interdit' });
    if (tentative.statut !== 'started') {
      return reply.status(409).send({ error: `Tentative déjà ${tentative.statut}` });
    }

    // Construire un map questionId → question
    const questionsMap = Object.fromEntries(
      tentative.test.questions.map(q => [q.id, q])
    );

    let scoreTotal = 0;
    let maxScore = 0;
    const reponsesData = [];

    for (const rep of reponses) {
      const question = questionsMap[rep.questionId];
      if (!question) continue; // question inconnue ignorée

      const estCorrecte =
        question.bonneReponse != null &&
        String(rep.reponse ?? '').trim().toLowerCase() ===
          String(question.bonneReponse).trim().toLowerCase();

      const pointsObt = estCorrecte ? question.points : 0;
      scoreTotal += pointsObt;
      maxScore += question.points;

      reponsesData.push({
        tentativeId: id,
        questionId: rep.questionId,
        reponse: rep.reponse != null ? String(rep.reponse) : null,
        estCorrecte,
        pointsObt
      });
    }

    // Ajouter 0 pour les questions sans réponse
    for (const q of tentative.test.questions) {
      const alreadyAnswered = reponsesData.find(r => r.questionId === q.id);
      if (!alreadyAnswered) {
        reponsesData.push({
          tentativeId: id,
          questionId: q.id,
          reponse: null,
          estCorrecte: false,
          pointsObt: 0
        });
        maxScore += q.points;
      }
    }

    // Enregistrer les réponses + clore la tentative dans une transaction
    const [, updated] = await app.prisma.$transaction([
      app.prisma.tentativeReponse.createMany({
        data: reponsesData,
        skipDuplicates: true
      }),
      app.prisma.tentative.update({
        where: { id },
        data: {
          submittedAt: new Date(),
          score: scoreTotal,
          maxScore,
          statut: 'submitted'
        }
      })
    ]);

    const pourcentage = maxScore > 0 ? Math.round((scoreTotal / maxScore) * 100) : 0;
    const reussi = pourcentage >= 70;

    return reply.send({
      tentativeId: id,
      score: scoreTotal,
      maxScore,
      pourcentage,
      reussi,
      detail: reponsesData.map(r => ({
        questionId: r.questionId,
        reponse: r.reponse,
        estCorrecte: r.estCorrecte,
        pointsObt: r.pointsObt,
        bonneReponse: questionsMap[r.questionId]?.bonneReponse ?? null
      }))
    });
  });

  /**
   * GET /tentatives/me
   * Retourne l'historique des tentatives soumises de l'élève connecté.
   */
  app.get('/me', {
    preHandler: [authenticate]
  }, async (req, reply) => {
    const eleveId = req.user.sub;

    const tentatives = await app.prisma.tentative.findMany({
      where: { eleveId, statut: 'submitted' },
      orderBy: { submittedAt: 'desc' },
      include: {
        test: {
          include: {
            module: { select: { slug: true, titre: true, ordre: true } }
          }
        }
      }
    });

    return reply.send({
      tentatives: tentatives.map(t => ({
        id: t.id,
        testId: t.testId,
        module: t.test.module,
        type: t.test.type,
        score: t.score,
        maxScore: t.maxScore,
        pourcentage: t.maxScore > 0
          ? Math.round(((t.score ?? 0) / t.maxScore) * 100)
          : null,
        reussi: t.maxScore > 0 && (t.score ?? 0) / t.maxScore >= 0.7,
        submittedAt: t.submittedAt
      }))
    });
  });
}

module.exports = { tentativesRoutes };
