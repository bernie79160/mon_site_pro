/**
 * routes/tests.js
 * POST /tests/:moduleId/tentatives  → démarre une tentative QCM
 */
'use strict';
const { authenticate } = require('../middlewares/auth');

async function testsRoutes(app) {
  /**
   * POST /tests/:moduleId/tentatives
   * Crée une tentative "started" pour le test QCM actif du module.
   * Retourne le test avec ses questions (sans les bonnes réponses).
   */
  app.post('/:moduleId/tentatives', {
    preHandler: [authenticate]
  }, async (req, reply) => {
    const { moduleId } = req.params;
    const eleveId = req.user.sub;

    // Vérifier que le module existe
    const module = await app.prisma.module.findUnique({
      where: { id: moduleId }
    });
    if (!module) {
      return reply.status(404).send({ error: 'Module introuvable' });
    }

    // Trouver le test QCM actif pour ce module
    const test = await app.prisma.test.findFirst({
      where: { moduleId, type: 'QCM', actif: true },
      include: {
        questions: {
          orderBy: { ordre: 'asc' },
          select: {
            id: true,
            ordre: true,
            intitule: true,
            options: true,
            points: true,
            competence: true
            // bonneReponse est délibérément omise
          }
        }
      }
    });
    if (!test) {
      return reply.status(404).send({ error: 'Aucun test QCM disponible pour ce module' });
    }

    // Annuler toute tentative "started" en cours pour ce test
    await app.prisma.tentative.updateMany({
      where: { eleveId, testId: test.id, statut: 'started' },
      data: { statut: 'abandoned' }
    });

    // Créer la nouvelle tentative
    const tentative = await app.prisma.tentative.create({
      data: {
        eleveId,
        testId: test.id,
        statut: 'started',
        maxScore: test.bareme
      }
    });

    return reply.status(201).send({
      tentativeId: tentative.id,
      testId: test.id,
      dureeSec: test.dureeSec,
      maxScore: test.bareme,
      questions: test.questions
    });
  });
}

module.exports = { testsRoutes };
