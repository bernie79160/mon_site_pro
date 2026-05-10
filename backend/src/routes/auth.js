const bcrypt = require('bcryptjs');
const { z } = require('zod');

const registerSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  groupeId: z.string().optional().nullable(),
  inviteCode: z.string().min(4).optional().nullable()
});

const bootstrapFormateurSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerEleveSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().optional(),
  inviteCode: z.string().min(4).optional().nullable()
});

const loginEleveSchema = z.object({
  prenom: z.string().min(1),
  eleveCode: z.string().min(8)
});

function normaliserPrenom(prenom) {
  return prenom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

function genererCodeCandidat(prenom) {
  const base = (normaliserPrenom(prenom).slice(0, 3) || 'ELV').padEnd(3, 'X');
  const suffixe = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffixe}`;
}

async function genererCodeUnique(app, prenom) {
  let tentative = 0;
  while (tentative < 20) {
    const eleveCode = genererCodeCandidat(prenom);
    const existing = await app.prisma.eleve.findUnique({ where: { eleveCode } });
    if (!existing) {
      return eleveCode;
    }
    tentative += 1;
  }

  throw new Error('Impossible de générer un code élève unique');
}

function formatPrenom(prenom) {
  if (!prenom) return '';
  return prenom.trim();
}

async function resolveGroupeIdFromRequest(app, groupeId, inviteCode) {
  if (groupeId) {
    const groupe = await app.prisma.groupe.findUnique({ where: { id: groupeId } });
    if (!groupe || !groupe.actif) {
      throw new Error('Groupe invalide ou inactif');
    }
    return groupe.id;
  }

  if (inviteCode) {
    const code = inviteCode.trim().toUpperCase();
    const groupe = await app.prisma.groupe.findUnique({ where: { inviteCode: code } });
    if (!groupe || !groupe.actif) {
      throw new Error('Code d\'invitation invalide ou groupe inactif');
    }
    return groupe.id;
  }

  return null;
}

module.exports = async function authRoutes(app) {
  app.post('/bootstrap-formateur', async (request, reply) => {
    const parsed = bootstrapFormateurSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const existingFormateur = await app.prisma.eleve.findFirst({
      where: {
        archivedAt: null,
        role: { in: ['FORMATEUR', 'ADMIN'] }
      }
    });

    if (existingFormateur) {
      return reply.code(409).send({ message: 'Un compte formateur existe déjà. Utilisez la connexion.' });
    }

    const prenom = formatPrenom(parsed.data.prenom);
    const nom = parsed.data.nom.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const eleve = await app.prisma.eleve.create({
      data: {
        prenom,
        nom,
        email,
        passwordHash,
        role: 'FORMATEUR',
        statut: 'actif',
        visitCount: 1,
        consentements: { bootstrapFormateur: true }
      }
    });

    const token = await reply.jwtSign({
      sub: eleve.id,
      role: eleve.role,
      prenom: eleve.prenom,
      nom: eleve.nom
    });

    return reply.code(201).send({
      token,
      user: {
        id: eleve.id,
        prenom: eleve.prenom,
        nom: eleve.nom,
        email: eleve.email,
        visitCount: eleve.visitCount,
        role: eleve.role
      }
    });
  });

  app.post('/register-eleve', async (request, reply) => {
    const parsed = registerEleveSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const prenom = formatPrenom(parsed.data.prenom);
    const nom = (parsed.data.nom || prenom).trim();
    let groupeId = null;
    try {
      groupeId = await resolveGroupeIdFromRequest(app, null, parsed.data.inviteCode);
    } catch (error) {
      return reply.code(400).send({ message: error.message });
    }
    const eleveCode = await genererCodeUnique(app, prenom);
    const passwordHash = await bcrypt.hash(`${eleveCode}-${Date.now()}`, 10);

    const eleve = await app.prisma.eleve.create({
      data: {
        prenom,
        nom,
        eleveCode,
        groupeId,
        passwordHash,
        visitCount: 1,
        role: 'ELEVE',
        consentements: { inscription: true }
      }
    });

    const token = await reply.jwtSign({
      sub: eleve.id,
      role: eleve.role,
      prenom: eleve.prenom,
      nom: eleve.nom
    });

    return reply.code(201).send({
      token,
      user: {
        id: eleve.id,
        prenom: eleve.prenom,
        nom: eleve.nom,
        eleveCode: eleve.eleveCode,
        visitCount: eleve.visitCount,
        role: eleve.role
      }
    });
  });

  app.post('/login-eleve', async (request, reply) => {
    const parsed = loginEleveSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const prenom = formatPrenom(parsed.data.prenom);
    const eleveCode = parsed.data.eleveCode.trim().toUpperCase();

    const user = await app.prisma.eleve.findFirst({
      where: {
        eleveCode,
        archivedAt: null,
        prenom: {
          equals: prenom,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      return reply.code(401).send({ message: 'Prénom ou identifiant invalide' });
    }

    let updatedUser = user;
    try {
      updatedUser = await app.prisma.eleve.update({
        where: { id: user.id },
        data: { visitCount: { increment: 1 } }
      });
    } catch (error) {
      const visitCountFieldMissing =
        typeof error?.message === 'string' &&
        error.message.includes('Unknown argument `visitCount`');

      if (!visitCountFieldMissing) {
        throw error;
      }

      app.log.warn({ err: error }, 'visitCount indisponible dans Prisma Client: login poursuivi sans incrément.');
    }

    const token = await reply.jwtSign({
      sub: updatedUser.id,
      role: updatedUser.role,
      prenom: updatedUser.prenom,
      nom: updatedUser.nom
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        eleveCode: updatedUser.eleveCode,
        email: updatedUser.email,
        visitCount: updatedUser.visitCount,
        role: updatedUser.role
      }
    };
  });

  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const prenom = formatPrenom(parsed.data.prenom);
    const nom = parsed.data.nom.trim();
    const { email, password, groupeId, inviteCode } = parsed.data;
    let finalGroupeId = null;
    try {
      finalGroupeId = await resolveGroupeIdFromRequest(app, groupeId, inviteCode);
    } catch (error) {
      return reply.code(400).send({ message: error.message });
    }


    const existingUser = await app.prisma.eleve.findUnique({ where: { email } });
    if (existingUser) {
      return reply.code(409).send({ message: 'Un compte existe déjà avec cet email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const eleveCode = await genererCodeUnique(app, prenom);

    const eleve = await app.prisma.eleve.create({
      data: {
        prenom,
        nom,
        eleveCode,
        email,
        passwordHash,
        visitCount: 1,
        role: 'ELEVE',
        groupeId: finalGroupeId,
        consentements: { inscription: true }
      }
    });

    const token = await reply.jwtSign({
      sub: eleve.id,
      role: eleve.role,
      prenom: eleve.prenom,
      nom: eleve.nom
    });

    return reply.code(201).send({
      token,
      user: {
        id: eleve.id,
        prenom: eleve.prenom,
        nom: eleve.nom,
        eleveCode: eleve.eleveCode,
        email: eleve.email,
        visitCount: eleve.visitCount,
        role: eleve.role
      }
    });
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: 'Données invalides', issues: parsed.error.issues });
    }

    const { email, password } = parsed.data;

    const user = await app.prisma.eleve.findFirst({ where: { email, archivedAt: null } });
    if (!user) {
      return reply.code(401).send({ message: 'Email ou mot de passe invalide' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return reply.code(401).send({ message: 'Email ou mot de passe invalide' });
    }

    const updatedUser = await app.prisma.eleve.update({
      where: { id: user.id },
      data: { visitCount: { increment: 1 } }
    });

    const token = await reply.jwtSign({
      sub: updatedUser.id,
      role: updatedUser.role,
      prenom: updatedUser.prenom,
      nom: updatedUser.nom
    });

    return {
      token,
      user: {
        id: updatedUser.id,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        eleveCode: updatedUser.eleveCode,
        email: updatedUser.email,
        visitCount: updatedUser.visitCount,
        role: updatedUser.role
      }
    };
  });
};
