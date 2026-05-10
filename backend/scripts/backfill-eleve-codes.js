require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normaliserPrenom(prenom) {
  return (prenom || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();
}

function genererCode(prenom) {
  const base = (normaliserPrenom(prenom).slice(0, 3) || 'ELV').padEnd(3, 'X');
  const suffixe = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffixe}`;
}

async function genererCodeUnique(prenom) {
  for (let tentative = 0; tentative < 50; tentative += 1) {
    const code = genererCode(prenom);
    const existing = await prisma.eleve.findUnique({ where: { eleveCode: code } });
    if (!existing) return code;
  }
  throw new Error(`Impossible de générer un code unique pour ${prenom}`);
}

async function run() {
  const elevesSansCode = await prisma.eleve.findMany({
    where: { eleveCode: null },
    select: { id: true, prenom: true }
  });

  if (elevesSansCode.length === 0) {
    console.log('✅ Aucun élève à backfill.');
    return;
  }

  let updated = 0;
  for (const eleve of elevesSansCode) {
    const eleveCode = await genererCodeUnique(eleve.prenom);
    await prisma.eleve.update({
      where: { id: eleve.id },
      data: { eleveCode }
    });
    updated += 1;
  }

  console.log(`✅ Backfill terminé : ${updated} élève(s) mis à jour.`);
}

run()
  .catch((error) => {
    console.error('❌ Erreur backfill eleveCode :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
