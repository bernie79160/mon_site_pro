const { z } = require('zod');
const { authenticate, requireRole } = require('../middlewares/auth');

const createModuleSchema = z.object({
  slug: z.string().min(2),
  titre: z.string().min(3),
  ordre: z.number().int().positive(),
  niveau: z.number().int().min(0).max(10).optional(),
  categorie: z.string().optional().nullable(),
  sourcePath: z.string().optional().nullable(),
  actif: z.boolean().optional()
});

function detectTrack(moduleItem) {
  const slug = (moduleItem.slug || '').toLowerCase();
  const category = (moduleItem.categorie || '').toLowerCase();

  if (slug.startsWith('word') || category === 'word') return 'word';
  if (slug.startsWith('excel') || category === 'excel') return 'excel';
  if (slug.startsWith('powerpoint') || category === 'powerpoint' || category === 'ppt') return 'powerpoint';
  return null;
}

function isModuleAllowedForStudent(moduleItem, groupLevels) {
  const track = detectTrack(moduleItem);
  if (!track) return true;

  const level = typeof moduleItem.niveau === 'number' ? moduleItem.niveau : 0;
  if (track === 'word') return level <= groupLevels.niveauWord;
  if (track === 'excel') return level <= groupLevels.niveauExcel;
  if (track === 'powerpoint') return level <= groupLevels.niveauPowerpoint;
  return true;
}

module.exports = async function modulesRoutes(app) {
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const modules = await app.prisma.module.findMany({
      where: { actif: true },
      orderBy: { ordre: 'asc' }
    });

    if (request.user.role === 'FORMATEUR' || request.user.role === 'ADMIN') {
      return modules;
    }

    const eleve = await app.prisma.eleve.findUnique({
      where: { id: request.user.sub },
      include: {
        groupe: {
          select: {
            niveauWord: true,
            niveauExcel: true,
            niveauPowerpoint: true
          }
        }
      }
    });

    const groupLevels = {
      niveauWord: eleve?.groupe?.niveauWord ?? 0,
      niveauExcel: eleve?.groupe?.niveauExcel ?? 0,
      niveauPowerpoint: eleve?.groupe?.niveauPowerpoint ?? 0
    };

    return modules.filter((moduleItem) => isModuleAllowedForStudent(moduleItem, groupLevels));
  });

  app.post(
    '/',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const parsed = createModuleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
      }

      try {
        const moduleData = await app.prisma.module.create({
          data: {
            slug: parsed.data.slug,
            titre: parsed.data.titre,
            ordre: parsed.data.ordre,
            niveau: parsed.data.niveau ?? 0,
            categorie: parsed.data.categorie || null,
            sourcePath: parsed.data.sourcePath || null,
            actif: parsed.data.actif ?? true
          }
        });

        return reply.code(201).send(moduleData);
      } catch (error) {
        return reply.code(409).send({ message: 'Slug ou ordre déjà utilisé', detail: error.message });
      }
    }
  );

  // ─── PATCH /modules/:id — Modifier un cours ───────────────────────────────
  const updateModuleSchema = z.object({
    titre: z.string().min(3).optional(),
    ordre: z.number().int().positive().optional(),
    niveau: z.number().int().min(0).max(10).optional(),
    categorie: z.string().optional().nullable(),
    sourcePath: z.string().optional().nullable(),
    actif: z.boolean().optional()
  });

  app.patch(
    '/:id',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params;
      const parsed = updateModuleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
      }

      const existing = await app.prisma.module.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ message: 'Module introuvable' });

      const updated = await app.prisma.module.update({
        where: { id },
        data: parsed.data
      });
      return updated;
    }
  );

  // ─── DELETE /modules/:id — Supprimer un cours ─────────────────────────────
  app.delete(
    '/:id',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const { id } = request.params;
      const existing = await app.prisma.module.findUnique({ where: { id } });
      if (!existing) return reply.code(404).send({ message: 'Module introuvable' });

      // Supprimer en cascade les tests liés
      await app.prisma.test.deleteMany({ where: { moduleId: id } });
      await app.prisma.module.delete({ where: { id } });
      return reply.code(204).send();
    }
  );
};
