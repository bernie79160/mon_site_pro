require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const modulesParDefaut = [
  { slug: 'pointeur', titre: 'Les formes du pointeur', ordre: 1, categorie: 'windows' },
  { slug: 'barredefil', titre: 'Les barres de défilement', ordre: 2, categorie: 'windows' },
  { slug: 'informatique', titre: 'L\'univers informatique', ordre: 3, categorie: 'bases' },
  { slug: 'windows', titre: 'L\'univers Windows', ordre: 4, categorie: 'windows' },
  { slug: 'explorateur', titre: 'L\'Explorateur', ordre: 5, categorie: 'windows' },
  { slug: 'bureau', titre: 'Le Bureau et les Icônes', ordre: 6, categorie: 'windows' },
  { slug: 'clavier', titre: 'Le clavier', ordre: 7, categorie: 'windows' },
  { slug: 'internet', titre: 'Internet', ordre: 8, categorie: 'internet' },
  { slug: 'mail', titre: 'La messagerie', ordre: 9, categorie: 'internet' },
  { slug: 'word', titre: 'Word', ordre: 10, categorie: 'office' },
  { slug: 'excel', titre: 'Excel', ordre: 11, categorie: 'office' },
  { slug: 'powerpoint', titre: 'PowerPoint', ordre: 12, categorie: 'office' },
  {
    slug: 'word-n1',
    titre: 'Word Niveau 1 - Mise en forme guidée',
    ordre: 13,
    niveau: 1,
    categorie: 'word',
    sourcePath: 'word_n1.html'
  },
  {
    slug: 'word-n2',
    titre: 'Word Niveau 2 - Structurer un document',
    ordre: 14,
    niveau: 2,
    categorie: 'word',
    sourcePath: 'word_n2.html'
  },
  {
    slug: 'word-n3',
    titre: 'Word Niveau 3 - Document professionnel',
    ordre: 15,
    niveau: 3,
    categorie: 'word',
    sourcePath: 'word_n3.html'
  },
  {
    slug: 'excel-n1',
    titre: 'Excel Niveau 1 - Saisie et formules de base',
    ordre: 16,
    niveau: 1,
    categorie: 'excel',
    sourcePath: 'excel_n1.html'
  },
  {
    slug: 'excel-n2',
    titre: 'Excel Niveau 2 - Mise en forme et fonctions',
    ordre: 17,
    niveau: 2,
    categorie: 'excel',
    sourcePath: 'excel_n2.html'
  },
  {
    slug: 'excel-n3',
    titre: 'Excel Niveau 3 - Graphiques et analyse',
    ordre: 18,
    niveau: 3,
    categorie: 'excel',
    sourcePath: 'excel_n3.html'
  },
  {
    slug: 'powerpoint-n1',
    titre: 'PowerPoint Niveau 1 - Créer une présentation',
    ordre: 19,
    niveau: 1,
    categorie: 'powerpoint',
    sourcePath: 'powerpoint_n1.html'
  },
  {
    slug: 'powerpoint-n2',
    titre: 'PowerPoint Niveau 2 - Mise en page et thèmes',
    ordre: 20,
    niveau: 2,
    categorie: 'powerpoint',
    sourcePath: 'powerpoint_n2.html'
  },
  {
    slug: 'powerpoint-n3',
    titre: 'PowerPoint Niveau 3 - Animations et diaporama',
    ordre: 21,
    niveau: 3,
    categorie: 'powerpoint',
    sourcePath: 'powerpoint_n3.html'
  }
];

async function run() {
  for (const moduleData of modulesParDefaut) {
    await prisma.module.upsert({
      where: { slug: moduleData.slug },
      update: {
        titre: moduleData.titre,
        ordre: moduleData.ordre,
        niveau: moduleData.niveau ?? 0,
        categorie: moduleData.categorie,
        sourcePath: moduleData.sourcePath || null,
        actif: true
      },
      create: {
        slug: moduleData.slug,
        titre: moduleData.titre,
        ordre: moduleData.ordre,
        niveau: moduleData.niveau ?? 0,
        categorie: moduleData.categorie,
        sourcePath: moduleData.sourcePath || null,
        actif: true
      }
    });
  }

  console.log(`✅ Seed modules terminé (${modulesParDefaut.length} modules).`);
}

run()
  .catch((error) => {
    console.error('❌ Erreur seed modules:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
