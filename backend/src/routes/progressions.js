const { z } = require('zod');
const { authenticate } = require('../middlewares/auth');

const upsertProgressionSchema = z.object({
  etat: z.enum(['LOCKED', 'IN_PROGRESS', 'DONE']),
  tempsSec: z.number().int().nonnegative().optional()
});

module.exports = async function progressionsRoutes(app) {
  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    return app.prisma.progression.findMany({
      where: { eleveId: request.user.sub },
      include: {
        module: {
          select: { id: true, slug: true, titre: true, ordre: true }
        }
      },
      orderBy: { module: { ordre: 'asc' } }
    });
  });

  app.put('/me/:moduleId', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = upsertProgressionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const { moduleId } = request.params;
    const moduleExists = await app.prisma.module.findUnique({ where: { id: moduleId } });

    if (!moduleExists) {
      return reply.code(404).send({ message: 'Module introuvable' });
    }

    const progression = await app.prisma.progression.upsert({
      where: {
        eleveId_moduleId: {
          eleveId: request.user.sub,
          moduleId
        }
      },
      create: {
        eleveId: request.user.sub,
        moduleId,
        etat: parsed.data.etat,
        tempsSec: parsed.data.tempsSec || 0
      },
      update: {
        etat: parsed.data.etat,
        tempsSec: parsed.data.tempsSec,
        lastActivityAt: new Date()
      }
    });

    return progression;
  });
};
