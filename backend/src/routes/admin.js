const { authenticate, requireRole } = require('../middlewares/auth');
const { z } = require('zod');

const createGroupeSchema = z.object({
  nom: z.string().min(2),
  session: z.string().optional().nullable(),
  niveauWord: z.number().int().min(0).max(10).optional(),
  niveauExcel: z.number().int().min(0).max(10).optional(),
  niveauPowerpoint: z.number().int().min(0).max(10).optional()
});

const patchNiveauxSchema = z.object({
  niveauWord: z.number().int().min(0).max(10).optional(),
  niveauExcel: z.number().int().min(0).max(10).optional(),
  niveauPowerpoint: z.number().int().min(0).max(10).optional()
}).refine((v) => v.niveauWord !== undefined || v.niveauExcel !== undefined || v.niveauPowerpoint !== undefined, {
  message: 'Aucun niveau fourni'
});

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'GRP-';
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function generateUniqueInviteCode(app) {
  for (let i = 0; i < 30; i += 1) {
    const inviteCode = generateInviteCode();
    const existing = await app.prisma.groupe.findUnique({ where: { inviteCode } });
    if (!existing) return inviteCode;
  }
  throw new Error('Impossible de générer un code invitation unique');
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function moyenne(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function normaliserScoreTentative(tentative) {
  if (tentative.score == null) return null;
  if (tentative.maxScore && tentative.maxScore > 0) {
    return (tentative.score / tentative.maxScore) * 100;
  }
  return tentative.score;
}

function calculerStatsEleve(eleve, totalModules) {
  const doneCount = eleve.progressions.filter((p) => p.etat === 'DONE').length;
  const progressionPct = totalModules > 0 ? (doneCount / totalModules) * 100 : 0;

  const notes = eleve.tentatives
    .map(normaliserScoreTentative)
    .filter((score) => score != null);

  return {
    id: eleve.id,
    prenom: eleve.prenom,
    nom: eleve.nom,
    eleveCode: eleve.eleveCode,
    progressionPct: round2(progressionPct),
    testsCount: notes.length,
    scoreMoyen: round2(moyenne(notes))
  };
}

module.exports = async function adminRoutes(app) {
  app.get(
    '/groupes',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request) => {
      const where = request.user.role === 'FORMATEUR'
        ? { formateurId: request.user.sub }
        : {};

      const groupes = await app.prisma.groupe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { eleves: true }
          }
        }
      });

      return {
        groupes: groupes.map((g) => ({
          id: g.id,
          nom: g.nom,
          session: g.session,
          inviteCode: g.inviteCode,
          niveaux: {
            word: g.niveauWord,
            excel: g.niveauExcel,
            powerpoint: g.niveauPowerpoint
          },
          effectif: g._count.eleves,
          actif: g.actif,
          createdAt: g.createdAt
        }))
      };
    }
  );

  app.post(
    '/groupes',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const parsed = createGroupeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
      }

      let inviteCode;
      try {
        inviteCode = await generateUniqueInviteCode(app);
      } catch (error) {
        return reply.code(500).send({ message: error.message });
      }

      const groupe = await app.prisma.groupe.create({
        data: {
          nom: parsed.data.nom,
          session: parsed.data.session || null,
          inviteCode,
          formateurId: request.user.role === 'FORMATEUR' ? request.user.sub : null,
          niveauWord: parsed.data.niveauWord ?? 0,
          niveauExcel: parsed.data.niveauExcel ?? 0,
          niveauPowerpoint: parsed.data.niveauPowerpoint ?? 0,
          actif: true
        }
      });

      return reply.code(201).send(groupe);
    }
  );

  app.patch(
    '/groupes/:id/niveaux',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const parsed = patchNiveauxSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
      }

      const groupe = await app.prisma.groupe.findUnique({ where: { id: request.params.id } });
      if (!groupe) {
        return reply.code(404).send({ message: 'Groupe introuvable' });
      }

      if (request.user.role === 'FORMATEUR' && groupe.formateurId !== request.user.sub) {
        return reply.code(403).send({ message: 'Accès refusé' });
      }

      const updated = await app.prisma.groupe.update({
        where: { id: request.params.id },
        data: {
          ...(parsed.data.niveauWord !== undefined ? { niveauWord: parsed.data.niveauWord } : {}),
          ...(parsed.data.niveauExcel !== undefined ? { niveauExcel: parsed.data.niveauExcel } : {}),
          ...(parsed.data.niveauPowerpoint !== undefined ? { niveauPowerpoint: parsed.data.niveauPowerpoint } : {})
        }
      });

      return reply.send(updated);
    }
  );

  app.post(
    '/groupes/:id/regenerate-invite-code',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request, reply) => {
      const groupe = await app.prisma.groupe.findUnique({ where: { id: request.params.id } });
      if (!groupe) {
        return reply.code(404).send({ message: 'Groupe introuvable' });
      }

      if (request.user.role === 'FORMATEUR' && groupe.formateurId !== request.user.sub) {
        return reply.code(403).send({ message: 'Accès refusé' });
      }

      let inviteCode;
      try {
        inviteCode = await generateUniqueInviteCode(app);
      } catch (error) {
        return reply.code(500).send({ message: error.message });
      }

      const updated = await app.prisma.groupe.update({
        where: { id: request.params.id },
        data: { inviteCode }
      });

      return reply.send({ id: updated.id, inviteCode: updated.inviteCode });
    }
  );

  app.get(
    '/groupes/overview',
    { preHandler: [authenticate, requireRole(['FORMATEUR', 'ADMIN'])] },
    async (request) => {
      const totalModules = await app.prisma.module.count({ where: { actif: true } });

      const groupeWhere = request.user.role === 'FORMATEUR'
        ? { formateurId: request.user.sub }
        : {};

      const groupes = await app.prisma.groupe.findMany({
        where: groupeWhere,
        orderBy: { createdAt: 'asc' },
        include: {
          eleves: {
            include: {
              progressions: true,
              tentatives: true
            }
          }
        }
      });

      const elevesSansGroupe = await app.prisma.eleve.findMany({
        where: { groupeId: null },
        include: {
          progressions: true,
          tentatives: true
        }
      });

      const groupeViews = groupes.map((groupe) => {
        const elevesStats = groupe.eleves.map((eleve) => calculerStatsEleve(eleve, totalModules));
        const progressionMoyennePct = round2(moyenne(elevesStats.map((e) => e.progressionPct)));
        const scoreMoyen = round2(moyenne(elevesStats.map((e) => e.scoreMoyen).filter((score) => score > 0)));
        const completionRate = round2(
          moyenne(elevesStats.map((e) => (e.progressionPct >= 100 ? 100 : 0)))
        );

        return {
          groupeId: groupe.id,
          nom: groupe.nom,
          session: groupe.session,
          inviteCode: groupe.inviteCode,
          niveaux: {
            word: groupe.niveauWord,
            excel: groupe.niveauExcel,
            powerpoint: groupe.niveauPowerpoint
          },
          effectif: elevesStats.length,
          progressionMoyennePct,
          scoreMoyen,
          completionRate,
          eleves: elevesStats
        };
      });

      if (elevesSansGroupe.length > 0) {
        const elevesStats = elevesSansGroupe.map((eleve) => calculerStatsEleve(eleve, totalModules));
        groupeViews.push({
          groupeId: null,
          nom: 'Sans groupe',
          session: null,
          effectif: elevesStats.length,
          progressionMoyennePct: round2(moyenne(elevesStats.map((e) => e.progressionPct))),
          scoreMoyen: round2(moyenne(elevesStats.map((e) => e.scoreMoyen).filter((score) => score > 0))),
          completionRate: round2(moyenne(elevesStats.map((e) => (e.progressionPct >= 100 ? 100 : 0)))),
          eleves: elevesStats
        });
      }

      return {
        totalModules,
        groupes: groupeViews,
        generatedAt: new Date().toISOString()
      };
    }
  );
};
