require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key.startsWith('--')) {
      args[key.slice(2)] = next && !next.startsWith('--') ? next : true;
      if (next && !next.startsWith('--')) i += 1;
    }
  }
  return args;
}

function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'GRP-';
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function generateUniqueInviteCode() {
  for (let i = 0; i < 40; i += 1) {
    const inviteCode = generateInviteCode();
    const existing = await prisma.groupe.findUnique({ where: { inviteCode } });
    if (!existing) return inviteCode;
  }
  throw new Error('Impossible de générer un code invitation unique');
}

function showUsage() {
  console.log('Usage:');
  console.log('  npm run formateur:create-group -- --nom "Session Bureautique" --session "Mai 2026" --word 1 --excel 0 --powerpoint 0');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const nom = String(args.nom || '').trim();
  const session = args.session ? String(args.session).trim() : null;
  const niveauWord = toInt(args.word, 0);
  const niveauExcel = toInt(args.excel, 0);
  const niveauPowerpoint = toInt(args.powerpoint, 0);

  if (!nom) {
    console.error('❌ Paramètre requis: --nom');
    showUsage();
    process.exit(1);
  }

  if ([niveauWord, niveauExcel, niveauPowerpoint].some((n) => n < 0 || n > 10)) {
    console.error('❌ Les niveaux doivent être entre 0 et 10.');
    process.exit(1);
  }

  const inviteCode = await generateUniqueInviteCode();

  const groupe = await prisma.groupe.create({
    data: {
      nom,
      session,
      inviteCode,
      niveauWord,
      niveauExcel,
      niveauPowerpoint,
      actif: true
    }
  });

  console.log('✅ Groupe créé');
  console.log(`- id: ${groupe.id}`);
  console.log(`- nom: ${groupe.nom}`);
  console.log(`- session: ${groupe.session || '-'}`);
  console.log(`- inviteCode: ${groupe.inviteCode}`);
  console.log(`- niveaux: word=${groupe.niveauWord}, excel=${groupe.niveauExcel}, powerpoint=${groupe.niveauPowerpoint}`);
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
