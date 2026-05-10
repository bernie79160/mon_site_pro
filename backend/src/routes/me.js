const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { authenticate } = require('../middlewares/auth');

const updateMeSchema = z.object({
  prenom: z.string().min(1).optional(),
  nom: z.string().min(1).optional(),
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8).optional()
}).refine((data) => data.prenom || data.nom || data.newPassword, {
  message: 'Aucune donnée à mettre à jour'
});

module.exports = async function meRoutes(app) {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await app.prisma.eleve.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        prenom: true,
        nom: true,
        eleveCode: true,
        email: true,
        role: true,
        statut: true,
        visitCount: true,
        groupeId: true,
        archivedAt: true,
        createdAt: true
      }
    });

    if (!user) {
      return reply.code(404).send({ message: 'Utilisateur introuvable' });
    }

    if (user.archivedAt) {
      return reply.code(410).send({ message: 'Compte archivé' });
    }

    return user;
  });

  app.patch('/', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = updateMeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const me = await app.prisma.eleve.findUnique({
      where: { id: request.user.sub }
    });

    if (!me || me.archivedAt) {
      return reply.code(404).send({ message: 'Utilisateur introuvable' });
    }

    const dataToUpdate = {};

    if (parsed.data.prenom) {
      dataToUpdate.prenom = parsed.data.prenom.trim();
    }

    if (parsed.data.nom) {
      dataToUpdate.nom = parsed.data.nom.trim();
    }

    if (parsed.data.newPassword) {
      if (!parsed.data.currentPassword) {
        return reply.code(400).send({ message: 'currentPassword est requis pour changer le mot de passe' });
      }

      const validPassword = await bcrypt.compare(parsed.data.currentPassword, me.passwordHash);
      if (!validPassword) {
        return reply.code(401).send({ message: 'Mot de passe actuel invalide' });
      }

      dataToUpdate.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    }

    const updated = await app.prisma.eleve.update({
      where: { id: request.user.sub },
      data: dataToUpdate,
      select: {
        id: true,
        prenom: true,
        nom: true,
        eleveCode: true,
        email: true,
        role: true,
        statut: true,
        visitCount: true,
        groupeId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return reply.send({
      message: 'Compte mis à jour',
      user: updated
    });
  });

  app.delete('/', { preHandler: [authenticate] }, async (request, reply) => {
    const me = await app.prisma.eleve.findUnique({
      where: { id: request.user.sub }
    });

    if (!me || me.archivedAt) {
      return reply.code(404).send({ message: 'Utilisateur introuvable' });
    }

    const anonymizedEmail = me.email
      ? `deleted+${Date.now()}-${me.id}@archived.local`
      : null;

    await app.prisma.eleve.update({
      where: { id: request.user.sub },
      data: {
        statut: 'archived',
        archivedAt: new Date(),
        eleveCode: null,
        email: anonymizedEmail,
        passwordHash: await bcrypt.hash(`${me.id}-${Date.now()}-archived`, 10)
      }
    });

    return reply.send({ message: 'Compte archivé avec succès' });
  });
};
