require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key.startsWith('--')) {
      args[key.slice(2)] = value && !value.startsWith('--') ? value : true;
      if (value && !value.startsWith('--')) index += 1;
    }
  }
  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const prenom = String(args.prenom || '').trim();
  const nom = String(args.nom || '').trim();
  const email = String(args.email || '').trim().toLowerCase();
  const password = String(args.password || '');

  if (!prenom || !nom || !email || password.length < 8) {
    console.error('❌ Paramètres invalides.');
    printUsage();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.eleve.findFirst({ where: { email } });

  if (existing) {
    const updated = await prisma.eleve.update({
      where: { id: existing.id },
      data: {
        prenom,
        nom,
        passwordHash,
        role: 'FORMATEUR',
        statut: 'actif',
        archivedAt: null
      }
    });

    console.log('✅ Compte existant promu/mis à jour en FORMATEUR');
    console.log(`- id: ${updated.id}`);
    console.log(`- email: ${updated.email}`);
    console.log(`- role: ${updated.role}`);
    return;
  }

  const created = await prisma.eleve.create({
    data: {
      prenom,
      nom,
      email,
      passwordHash,
      role: 'FORMATEUR',
      consentements: { createdByScript: true }
    }
  });

  console.log('✅ Compte formateur créé');
  console.log(`- id: ${created.id}`);
  console.log(`- email: ${created.email}`);
  console.log(`- role: ${created.role}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
