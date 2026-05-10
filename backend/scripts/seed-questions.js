/**
 * seed-questions.js
 * Insère des tests QCM et leurs questions pour les modules du parcours.
 * Usage: npm run seed:questions
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DATA = [
  {
    moduleSlug: 'informatique',
    questions: [
      {
        ordre: 1,
        intitule: "Que signifie l'acronyme CPU ?",
        options: [
          "Central Processing Unit",
          "Computer Personal Unit",
          "Central Power Unit",
          "Computer Processing Unit"
        ],
        bonneReponse: "Central Processing Unit",
        points: 1,
        competence: 'culture-informatique'
      },
      {
        ordre: 2,
        intitule: "Quelle unité représente la capacité de stockage ?",
        options: ["Hz", "Watt", "Octet (Byte)", "Pixel"],
        bonneReponse: "Octet (Byte)",
        points: 1,
        competence: 'culture-informatique'
      },
      {
        ordre: 3,
        intitule: "Quel composant stocke les données de façon permanente ?",
        options: ["RAM", "CPU", "Disque dur (HDD/SSD)", "Ventilateur"],
        bonneReponse: "Disque dur (HDD/SSD)",
        points: 1,
        competence: 'culture-informatique'
      }
    ]
  },
  {
    moduleSlug: 'pointeur',
    questions: [
      {
        ordre: 1,
        intitule: "Quelle touche permet de cliquer sans bouton de souris sur Mac ?",
        options: ["Ctrl", "Alt", "Ctrl + clic", "Shift"],
        bonneReponse: "Ctrl + clic",
        points: 1,
        competence: 'souris'
      },
      {
        ordre: 2,
        intitule: "Le double-clic sert principalement à :",
        options: [
          "Fermer une fenêtre",
          "Ouvrir un fichier ou un programme",
          "Copier un fichier",
          "Renommer un dossier"
        ],
        bonneReponse: "Ouvrir un fichier ou un programme",
        points: 1,
        competence: 'souris'
      },
      {
        ordre: 3,
        intitule: "Le clic droit affiche :",
        options: [
          "Un menu contextuel",
          "Les propriétés du système",
          "La corbeille",
          "Le bureau"
        ],
        bonneReponse: "Un menu contextuel",
        points: 1,
        competence: 'souris'
      }
    ]
  },
  {
    moduleSlug: 'clavier',
    questions: [
      {
        ordre: 1,
        intitule: "La touche Maj (Shift) permet de :",
        options: [
          "Effacer un caractère",
          "Écrire une lettre majuscule",
          "Déplacer le curseur",
          "Ouvrir le menu démarrer"
        ],
        bonneReponse: "Écrire une lettre majuscule",
        points: 1,
        competence: 'clavier'
      },
      {
        ordre: 2,
        intitule: "La touche Retour arrière (Backspace) :",
        options: [
          "Supprime le caractère à gauche du curseur",
          "Supprime le caractère à droite du curseur",
          "Ajoute un espace",
          "Valide la saisie"
        ],
        bonneReponse: "Supprime le caractère à gauche du curseur",
        points: 1,
        competence: 'clavier'
      },
      {
        ordre: 3,
        intitule: "Le raccourci Ctrl + Z permet de :",
        options: ["Enregistrer", "Annuler la dernière action", "Couper", "Coller"],
        bonneReponse: "Annuler la dernière action",
        points: 1,
        competence: 'clavier'
      }
    ]
  },
  {
    moduleSlug: 'windows',
    questions: [
      {
        ordre: 1,
        intitule: "Le bureau Windows est :",
        options: [
          "L'espace de travail principal affiché au démarrage",
          "Un logiciel de traitement de texte",
          "Un dossier de stockage",
          "Un antivirus"
        ],
        bonneReponse: "L'espace de travail principal affiché au démarrage",
        points: 1,
        competence: 'windows'
      },
      {
        ordre: 2,
        intitule: "La barre des tâches se trouve généralement :",
        options: ["En haut", "Au centre", "En bas", "Sur le côté gauche"],
        bonneReponse: "En bas",
        points: 1,
        competence: 'windows'
      },
      {
        ordre: 3,
        intitule: "Pour fermer une fenêtre, on clique sur :",
        options: ["Le bouton vert", "Le bouton rouge ×", "Le bouton jaune", "La barre de titre"],
        bonneReponse: "Le bouton rouge ×",
        points: 1,
        competence: 'windows'
      }
    ]
  }
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const { moduleSlug, questions } of DATA) {
    const module = await prisma.module.findUnique({ where: { slug: moduleSlug } });
    if (!module) {
      console.warn(`⚠️  Module "${moduleSlug}" introuvable, ignoré.`);
      skipped++;
      continue;
    }

    // Upsert du Test QCM pour ce module
    const test = await prisma.test.upsert({
      where: {
        // pas de contrainte unique directe, on cherche manuellement
        id: (await prisma.test.findFirst({
          where: { moduleId: module.id, type: 'QCM' }
        }))?.id ?? 'new'
      },
      update: {},
      create: {
        moduleId: module.id,
        type: 'QCM',
        niveau: 'debutant',
        dureeSec: 300,
        bareme: questions.reduce((s, q) => s + q.points, 0),
        actif: true
      }
    });

    // Upsert questions
    for (const q of questions) {
      await prisma.question.upsert({
        where: { testId_ordre: { testId: test.id, ordre: q.ordre } },
        update: {
          intitule: q.intitule,
          options: q.options,
          bonneReponse: q.bonneReponse,
          points: q.points,
          competence: q.competence
        },
        create: {
          testId: test.id,
          ordre: q.ordre,
          intitule: q.intitule,
          options: q.options,
          bonneReponse: q.bonneReponse,
          points: q.points,
          competence: q.competence
        }
      });
      created++;
    }

    console.log(`✅ Module "${moduleSlug}" — ${questions.length} question(s) insérée(s), test id: ${test.id}`);
  }

  console.log(`\n📊 Total : ${created} question(s) créées/mises à jour, ${skipped} module(s) ignoré(s)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
