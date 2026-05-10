/**
 * seed-quizs.js
 * Crée des QCMs (3 questions chacun) pour les modules principaux.
 * Usage : node scripts/seed-quizs.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const quizs = [
  // ─── POINTEUR ────────────────────────────────────────────────────────
  {
    slug: 'pointeur',
    titre: 'Quiz — Les formes du pointeur',
    questions: [
      {
        intitule: 'Que signifie le curseur en forme de sablier (⌛) sous Windows ?',
        options: ["L'ordinateur traite une tâche, patientez", "Vous pouvez taper du texte", "La souris est en panne", "Vous êtes hors ligne"],
        bonneReponse: "L'ordinateur traite une tâche, patientez",
        points: 1
      },
      {
        intitule: 'Quel curseur apparaît quand on peut redimensionner une fenêtre ?',
        options: ['Une double flèche ↔', 'Une main 👆', 'Une croix +', 'Un sablier ⌛'],
        bonneReponse: 'Une double flèche ↔',
        points: 1
      },
      {
        intitule: 'Le curseur en forme de main 👆 indique :',
        options: ['Un lien cliquable', 'Une zone de texte éditable', 'Un fichier en téléchargement', "Une erreur système"],
        bonneReponse: 'Un lien cliquable',
        points: 1
      }
    ]
  },
  // ─── BARREDEFIL ──────────────────────────────────────────────────────
  {
    slug: 'barredefil',
    titre: 'Quiz — Barres de défilement',
    questions: [
      {
        intitule: 'Où se trouve généralement la barre de défilement verticale ?',
        options: ['À droite de la fenêtre', 'En haut de la fenêtre', 'À gauche de la fenêtre', 'En bas de la fenêtre'],
        bonneReponse: 'À droite de la fenêtre',
        points: 1
      },
      {
        intitule: 'Comment descendre rapidement en bas dun document avec le clavier ?',
        options: ['Touche Fin (End)', 'Touche Entrée', 'Touche Suppr', 'Touche F5'],
        bonneReponse: 'Touche Fin (End)',
        points: 1
      },
      {
        intitule: 'La molette de la souris sert principalement à :',
        options: ['Faire défiler le contenu', 'Cliquer plus vite', 'Zoomer sur lécran', 'Ouvrir un menu'],
        bonneReponse: 'Faire défiler le contenu',
        points: 1
      }
    ]
  },
  // ─── INFORMATIQUE ────────────────────────────────────────────────────
  {
    slug: 'informatique',
    titre: 'Quiz — L\'univers informatique',
    questions: [
      {
        intitule: 'Que signifie l\'acronyme CPU ?',
        options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Power Unit', 'Computer Processing Unit'],
        bonneReponse: 'Central Processing Unit',
        points: 1
      },
      {
        intitule: 'Quel composant stocke les données de façon permanente ?',
        options: ['Le disque dur (HDD/SSD)', 'La RAM', 'Le processeur', 'La carte graphique'],
        bonneReponse: 'Le disque dur (HDD/SSD)',
        points: 1
      },
      {
        intitule: 'Que signifie RAM ?',
        options: ['Random Access Memory', 'Read All Memory', 'Rapid Access Module', 'Removable Access Memory'],
        bonneReponse: 'Random Access Memory',
        points: 1
      }
    ]
  },
  // ─── WINDOWS ─────────────────────────────────────────────────────────
  {
    slug: 'windows',
    titre: 'Quiz — L\'univers Windows',
    questions: [
      {
        intitule: 'Comment ouvrir le menu Démarrer ?',
        options: ['Clic sur la touche Windows ou le bouton Démarrer', 'Double-clic sur le bureau', 'Appuyer sur F1', 'Clic droit sur la barre des tâches'],
        bonneReponse: 'Clic sur la touche Windows ou le bouton Démarrer',
        points: 1
      },
      {
        intitule: 'Quel raccourci clavier permet de fermer une application ?',
        options: ['Alt + F4', 'Ctrl + Z', 'Windows + D', 'Ctrl + S'],
        bonneReponse: 'Alt + F4',
        points: 1
      },
      {
        intitule: 'Où se trouvent les notifications sous Windows 10/11 ?',
        options: ['En bas à droite de l\'écran', 'En haut à gauche', 'Dans le menu Démarrer', 'Dans le Panneau de configuration'],
        bonneReponse: 'En bas à droite de l\'écran',
        points: 1
      }
    ]
  },
  // ─── EXPLORATEUR ─────────────────────────────────────────────────────
  {
    slug: 'explorateur',
    titre: 'Quiz — L\'Explorateur de fichiers',
    questions: [
      {
        intitule: 'Quel raccourci ouvre l\'Explorateur de fichiers Windows ?',
        options: ['Windows + E', 'Ctrl + E', 'Alt + E', 'F2'],
        bonneReponse: 'Windows + E',
        points: 1
      },
      {
        intitule: 'Pour renommer un fichier, on appuie sur :',
        options: ['F2', 'F5', 'Entrée', 'Ctrl + R'],
        bonneReponse: 'F2',
        points: 1
      },
      {
        intitule: 'Quel dossier contient les fichiers supprimés en attente de suppression définitive ?',
        options: ['La Corbeille', 'Mes Documents', 'Téléchargements', 'Bureau'],
        bonneReponse: 'La Corbeille',
        points: 1
      }
    ]
  },
  // ─── INTERNET ────────────────────────────────────────────────────────
  {
    slug: 'internet',
    titre: 'Quiz — Naviguer sur Internet',
    questions: [
      {
        intitule: 'Que signifie l\'acronyme URL ?',
        options: ['Uniform Resource Locator', 'Universal Reading Link', 'User Resource Location', 'Uniform Reading Language'],
        bonneReponse: 'Uniform Resource Locator',
        points: 1
      },
      {
        intitule: 'Quel protocole sécurise les échanges sur un site web ?',
        options: ['HTTPS', 'HTTP', 'FTP', 'DNS'],
        bonneReponse: 'HTTPS',
        points: 1
      },
      {
        intitule: 'À quoi sert un moteur de recherche comme Google ?',
        options: ['Trouver des pages web par mots-clés', 'Stocker des fichiers en ligne', 'Envoyer des emails', 'Créer des sites internet'],
        bonneReponse: 'Trouver des pages web par mots-clés',
        points: 1
      }
    ]
  },
  // ─── MAIL ────────────────────────────────────────────────────────────
  {
    slug: 'mail',
    titre: 'Quiz — La messagerie',
    questions: [
      {
        intitule: 'Que faut-il faire avant d\'envoyer un email important ?',
        options: ['Vérifier le destinataire et relire le message', 'Attendre le lendemain', 'Supprimer les pièces jointes', 'Copier le texte dans Word'],
        bonneReponse: 'Vérifier le destinataire et relire le message',
        points: 1
      },
      {
        intitule: 'Qu\'est-ce que le champ "CC" dans un email ?',
        options: ['Copie Conforme (autres destinataires informés)', 'Corps du message', 'Confirmation de Connexion', 'Code de Confirmation'],
        bonneReponse: 'Copie Conforme (autres destinataires informés)',
        points: 1
      },
      {
        intitule: 'Quel est le signe caractéristique d\'une adresse email valide ?',
        options: ['Le symbole @', 'Le symbole #', 'Le symbole &', 'Le symbole /'],
        bonneReponse: 'Le symbole @',
        points: 1
      }
    ]
  },
  // ─── WORD ─────────────────────────────────────────────────────────────
  {
    slug: 'word',
    titre: 'Quiz — Écrire avec Word',
    questions: [
      {
        intitule: 'Quel raccourci clavier met le texte sélectionné en gras dans Word ?',
        options: ['Ctrl + G', 'Ctrl + B', 'Ctrl + I', 'Ctrl + U'],
        bonneReponse: 'Ctrl + G',
        points: 1,
        competence: 'Mise en forme'
      },
      {
        intitule: 'Comment enregistrer un document Word sous un nouveau nom ?',
        options: ['Fichier > Enregistrer sous', 'Ctrl + S', 'Fichier > Nouveau', 'Ctrl + N'],
        bonneReponse: 'Fichier > Enregistrer sous',
        points: 1,
        competence: 'Gestion des fichiers'
      },
      {
        intitule: 'Quel raccourci annule la dernière action dans Word ?',
        options: ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + S', 'Ctrl + X'],
        bonneReponse: 'Ctrl + Z',
        points: 1,
        competence: 'Navigation'
      }
    ]
  },
  // ─── EXCEL ────────────────────────────────────────────────────────────
  {
    slug: 'excel',
    titre: 'Quiz — Calculer avec Excel',
    questions: [
      {
        intitule: 'Comment commence toujours une formule dans Excel ?',
        options: ['Par le signe =', 'Par le signe +', 'Par une lettre', 'Par le signe #'],
        bonneReponse: 'Par le signe =',
        points: 1,
        competence: 'Formules'
      },
      {
        intitule: 'Quelle fonction calcule la somme de A1 à A5 ?',
        options: ['=SOMME(A1:A5)', '=TOTAL(A1;A5)', '=ADDITION(A1:A5)', '=CUMUL(A1,A5)'],
        bonneReponse: '=SOMME(A1:A5)',
        points: 1,
        competence: 'Formules'
      },
      {
        intitule: 'Comment appelle-t-on les lignes et colonnes qui se croisent dans Excel ?',
        options: ['Une cellule', 'Un champ', 'Un bloc', 'Une case'],
        bonneReponse: 'Une cellule',
        points: 1,
        competence: 'Vocabulaire'
      }
    ]
  },
  // ─── POWERPOINT ───────────────────────────────────────────────────────
  {
    slug: 'powerpoint',
    titre: 'Quiz — Présenter avec PowerPoint',
    questions: [
      {
        intitule: 'Comment lancer un diaporama en plein écran depuis le début ?',
        options: ['Touche F5', 'Ctrl + P', 'Alt + F4', 'Touche F12'],
        bonneReponse: 'Touche F5',
        points: 1,
        competence: 'Présentation'
      },
      {
        intitule: 'Quel onglet permet d\'ajouter une animation à un objet dans PowerPoint ?',
        options: ['Animations', 'Création', 'Révision', 'Affichage'],
        bonneReponse: 'Animations',
        points: 1,
        competence: 'Animations'
      },
      {
        intitule: 'Que signifie "transition" dans PowerPoint ?',
        options: ['Effet visuel entre deux diapositives', 'Changer la couleur du texte', 'Insérer une image', 'Supprimer une diapositive'],
        bonneReponse: 'Effet visuel entre deux diapositives',
        points: 1,
        competence: 'Animations'
      }
    ]
  }
];

async function run() {
  let total = 0;

  for (const quizDef of quizs) {
    // Trouver le module correspondant
    const module = await prisma.module.findUnique({ where: { slug: quizDef.slug } });
    if (!module) {
      console.warn(`⚠️  Module introuvable pour slug "${quizDef.slug}", ignoré.`);
      continue;
    }

    // Vérifier si un test QCM actif existe déjà
    const existing = await prisma.test.findFirst({
      where: { moduleId: module.id, type: 'QCM', actif: true }
    });
    if (existing) {
      console.log(`↩  Quiz déjà existant pour "${quizDef.slug}", ignoré.`);
      continue;
    }

    // Calculer le barème total
    const bareme = quizDef.questions.reduce((s, q) => s + q.points, 0);

    // Créer le test + questions
    await prisma.test.create({
      data: {
        moduleId: module.id,
        type: 'QCM',
        bareme,
        dureeSec: 120,
        actif: true,
        questions: {
          create: quizDef.questions.map((q, i) => ({
            ordre: i + 1,
            intitule: q.intitule,
            options: q.options,
            bonneReponse: q.bonneReponse,
            points: q.points,
            competence: q.competence || null
          }))
        }
      }
    });

    console.log(`✅ Quiz créé : ${quizDef.titre}`);
    total++;
  }

  console.log(`\n🎉 Seed quizs terminé — ${total} quiz(s) créé(s).`);
}

run()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
