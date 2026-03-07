// ==========================================
// 1. SYSTÈME DE PROGRESSION ET THÈME
// ==========================================

// --- GESTION DU TEMPS ---
let chronoDebut = 0;
// À appeler au chargement d'une page de cours (ex: <body onload="demarrerChrono()">)
function demarrerChrono() {
  chronoDebut = Date.now();
}

const ordreCours = [
  "pointeur",
  "informatique",
  "windows",
  "explorateur",
  "bureau",
  "clavier",
  "word",
  "excel",
  "powerpoint",
  "mail",
];

window.addEventListener("DOMContentLoaded", () => {
  chargerTheme();
  mettreAJourProgression();
  if (document.querySelector(".cours-card")) {
    appliquerVerrouillageVisuel();
  }
});

function chargerTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    const btn = document.getElementById("theme-icon");
    if (btn) btn.textContent = "☀️ Mode Clair";
  }
}

function toggleModeSombre() {
  const isSombre = document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isSombre ? "dark" : "light");
  const btn = document.getElementById("theme-icon");
  if (btn) btn.textContent = isSombre ? "☀️ Mode Clair" : "🌙 Mode Sombre";
}

function mettreAJourProgression() {
  let terminés = 0;
  ordreCours.forEach((cours) => {
    if (localStorage.getItem("cours-" + cours) === "done") {
      terminés++;
      const badge = document.getElementById("badge-" + cours);
      if (badge) badge.style.display = "block";
    }
  });

  const pourcent = Math.round((terminés / ordreCours.length) * 100);
  const fill = document.getElementById("progress-fill");
  const txt = document.getElementById("progress-text");

  if (fill) fill.style.width = pourcent + "%";
  if (txt) txt.innerText = pourcent + "%";
}

function appliquerVerrouillageVisuel() {
  // On récupère l'utilisateur
  let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
  
  // SI ADMIN : On ne verrouille rien du tout visuellement
  if (user && user.isAdmin) return; 

  ordreCours.forEach((cours, index) => {
    if (index === 0) return;
    const precedentFait = localStorage.getItem("cours-" + ordreCours[index - 1]) === "done";
    const carte = document.getElementById("card-" + cours);

    if (carte && !precedentFait && localStorage.getItem("cours-" + cours) !== "done") {
      carte.classList.add("card-locked");
      // Optionnel : on désactive aussi le bouton ici pour être sûr
      const btn = carte.querySelector('.btn-card');
      if(btn) btn.disabled = true;
    }
  });
}

function ouvrirCours(nom) {
  window.location.href = nom + ".html";
}

// ==========================================
// 2. MODALE DE CONFIRMATION ET MESSAGES (ANTI-FENÊTRE NOIRE)
// ==========================================

// --- Fonction générique pour les cartes de cours ---
function validerCours(cours) {
  let chronoFin = Date.now();
  let tempsEnSecondes = Math.floor((chronoFin - chronoDebut) / 1000);

  // On récupère l'utilisateur
  let userStr = localStorage.getItem("utilisateurActuel");
  if (userStr) {
    let user = JSON.parse(userStr);

    // Si ce n'est pas l'admin, on sauvegarde son temps
    if (!user.isAdmin) {
      user.tempsParCours[cours] = tempsEnSecondes;
      localStorage.setItem("utilisateurActuel", JSON.stringify(user));

      // NOUVEAU : On met à jour le carnet global pour le formateur
      let carnetStr = localStorage.getItem("carnetEtudiants");
      let carnet = carnetStr ? JSON.parse(carnetStr) : {};
      carnet[user.nom] = user; // Ajoute ou met à jour l'élève
      localStorage.setItem("carnetEtudiants", JSON.stringify(carnet));
    }
  }

  afficherModaleValidation(
    "Validation",
    "Bravo ! Souhaitez-vous valider ce cours et retourner à l'accueil ?",
    () => {
      localStorage.setItem("cours-" + cours, "done");
      window.location.href = "index.html";
    },
  );
}

// --- Fonction spécifique pour l'explorateur ---
function validerCoursExplorateur() {
  afficherModaleValidation(
    "Félicitations !",
    "Mission accomplie. Voulez-vous valider cet exercice et retourner à l'accueil ?",
    () => {
      localStorage.setItem("cours-explorateur", "done");
      window.location.href = "index.html";
    },
  );
}

// --- REMPLACE LES ALERT() PAR UNE MODALE PROPRE ---
function afficherMessage(titre, message) {
  const overlay = document.createElement("div");
  overlay.className = "custom-confirm-overlay";

  overlay.innerHTML = `
        <div class="custom-confirm-box">
            <h2><i class="fas fa-info-circle" style="color: #3498db;"></i> ${titre}</h2>
            <p>${message}</p>
            <div class="confirm-btns">
                <button class="btn-confirm btn-yes" id="btnCloseMsg">D'accord</button>
            </div>
        </div>
    `;
  document.body.appendChild(overlay);
  document.getElementById("btnCloseMsg").onclick = () => overlay.remove();
}

// --- Fonction interne pour créer la modale de validation ---
function afficherModaleValidation(titre, message, callbackYes) {
  const overlay = document.createElement("div");
  overlay.className = "custom-confirm-overlay";

  overlay.innerHTML = `
        <div class="custom-confirm-box">
            <h2><i class="fas fa-check-circle" style="color: #2ecc71;"></i> ${titre}</h2>
            <p>${message}</p>
            <div class="confirm-btns">
                <button class="btn-confirm btn-no" id="btnNo">Annuler</button>
                <button class="btn-confirm btn-yes" id="btnYes">Oui, valider</button>
            </div>
        </div>
    `;

  document.body.appendChild(overlay);

  document.getElementById("btnYes").onclick = () => {
    overlay.remove();
    callbackYes();
  };

  document.getElementById("btnNo").onclick = () => {
    overlay.remove();
  };
}

// ==========================================
// 3. LOGIQUE DE L'EXPLORATEUR ET DU BUREAU
// ==========================================
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev, typeCible) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData("text");
  const elementGlisse = document.getElementById(data);

  if (elementGlisse && elementGlisse.getAttribute("data-type") === typeCible) {
    elementGlisse.style.display = "none";
    if (typeof verifierFinBureau === "function") verifierFinBureau();
  } else {
    // Utilisation de notre nouvelle fonction au lieu de alert()
    afficherMessage("Oups !", "Ce n'est pas le bon dossier !");
  }
}

// --- SYSTÈME DE CONNEXION & PROGRESSION ---

// On lance la vérification au chargement de la page d'accueil
if (
  window.location.pathname.includes("index.html") ||
  window.location.pathname === "/"
) {
  window.onload = verifierConnexion;
}

function togglePassword() {
  const isChecked = document.getElementById("check-admin").checked;
  document.getElementById("login-mdp").style.display = isChecked
    ? "inline-block"
    : "none";
}

function verifierConnexion() {
  let userStr = localStorage.getItem("utilisateurActuel");
  let visites = localStorage.getItem("visitesGlobales") || 0;

  if (!userStr) {
    document.getElementById("login-modal").style.display = "flex";
  } else {
    let user = JSON.parse(userStr);
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("user-info").style.display = "block";
    document.getElementById("nom-affichage").innerText = user.nom;

    // --- AJOUT ICI : RESTAURATION AUTOMATIQUE AU F5 ---
    if (user.tempsParCours) {
      for (let cours in user.tempsParCours) {
        localStorage.setItem("cours-" + cours, "done");
      }
    }
    // ------------------------------------------------

    if (user.isAdmin) {
      document.getElementById("badge-admin").style.display = "inline-block";
      document.getElementById("admin-access-zone").style.display = "block";
    } else {
      document.getElementById("badge-admin").style.display = "none";
      document.getElementById("admin-access-zone").style.display = "none";
      
      if (!sessionStorage.getItem("visiteComptee")) {
        visites++;
        localStorage.setItem("visitesGlobales", visites);
        sessionStorage.setItem("visiteComptee", "oui");
      }
    }
    
    document.getElementById("compteur-visite").innerText = visites;

    // On relance les mises à jour visuelles
    mettreAJourProgression();
    appliquerVerrouillageVisuel();
  }
}

function seConnecter() {
  let nom = document.getElementById("login-nom").value.trim();
  let isFormateur = document.getElementById("check-admin").checked;
  let mdp = document.getElementById("login-mdp").value;

  if (!nom) {
    alert("Veuillez entrer un prénom.");
    return;
  }

  // 1. On récupère d'abord le carnet complet
  let carnetStr = localStorage.getItem("carnetEtudiants");
  let carnet = carnetStr ? JSON.parse(carnetStr) : {};

  // 2. On regarde si cet élève existe déjà
  let user;
  if (carnet[nom]) {
    // Si oui, on reprend son profil (avec ses temps déjà faits !)
    user = carnet[nom];
  } else {
    // Si non, on crée un nouveau profil vide
    user = { nom: nom, isAdmin: false, tempsParCours: {} };
  }

  // 3. Gestion de l'admin
  if (isFormateur) {
    if (mdp === "1234") {
      user.isAdmin = true;
    } else {
      alert("Mot de passe admin incorrect.");
      return;
    }
  } else {
    // Si on se connecte en mode élève, on s'assure qu'il n'est pas admin
    user.isAdmin = false;
  }

  // 4. On sauvegarde et on rafraîchit
  localStorage.setItem("utilisateurActuel", JSON.stringify(user));
  verifierConnexion();

  // NOUVEAU : Restaurer les badges de progression de cet élève précis
  if (user.tempsParCours) {
    for (let cours in user.tempsParCours) {
      localStorage.setItem("cours-" + cours, "done");
    }
  }

  // 4. On sauvegarde et on rafraîchit
  localStorage.setItem("utilisateurActuel", JSON.stringify(user));
  verifierConnexion();
  
  // On force le rafraîchissement des badges et de la barre
  mettreAJourProgression();
}

function nettoyerInterface() {
    // 1. On cache tous les badges "Terminé"
    const badges = document.querySelectorAll(".badge-succes");
    badges.forEach(badge => {
        // On ne cache pas le badge Admin, celui-là est géré par verifierConnexion
        if (badge.id !== "badge-admin") {
            badge.style.display = "none";
        }
    });

    // 2. On remet la barre de progression à 0
    const fill = document.getElementById("progress-fill");
    const txt = document.getElementById("progress-text");
    if (fill) fill.style.width = "0%";
    if (txt) txt.innerText = "0%";

    // 3. On reverrouille visuellement les cartes (optionnel car le reload le fera)
    const cartes = document.querySelectorAll(".cours-card");
    cartes.forEach(carte => {
        carte.classList.add("card-locked");
        carte.style.opacity = "0.5";
        carte.style.filter = "grayscale(100%)";
    });
}

function seDeconnecter() {
    // 1. On retire l'utilisateur actuel
    localStorage.removeItem("utilisateurActuel");
    sessionStorage.removeItem("visiteComptee");

    // 2. IMPORTANT : Si on veut que l'élève suivant parte de zéro 
    // sur CET ordinateur, on nettoie les marqueurs de réussite individuels
    ordreCours.forEach(cours => {
        localStorage.removeItem("cours-" + cours);
    });

    // 3. On remet le formulaire de connexion à zéro
    const checkAdmin = document.getElementById("check-admin");
    if (checkAdmin) checkAdmin.checked = false;
    
    const mdpInput = document.getElementById("login-mdp");
    if (mdpInput) {
        mdpInput.style.display = "none";
        mdpInput.value = "";
    }

    // 4. On nettoie les éléments visuels (badges, progression)
    nettoyerInterface();

    // 5. On recharge pour afficher la modale de connexion proprement
    location.reload(); 
}

function debloquerCoursInterface(user) {
    let boutons = document.querySelectorAll(".btn-card");
    
    // SI C'EST L'ADMIN : On débloque tout sans condition
    if (user && user.isAdmin) {
        boutons.forEach((btn) => {
            btn.disabled = false;
            btn.parentElement.style.opacity = "1"; // On remet la carte en brillant
            btn.style.cursor = "pointer";
        });
        return; // On arrête la fonction ici pour l'admin
    }

    // POUR LES ÉTUDIANTS : On applique le verrouillage normal
    boutons.forEach((btn) => {
        const cours = btn.getAttribute("data-cours");
        const index = ordreCours.indexOf(cours);
    })
}

// ==========================================
// 4. FONCTIONS DU TABLEAU DE BORD ADMIN
// ==========================================

/**
 * Ouvre la fenêtre modale du dashboard et génère le tableau des résultats
 */
function ouvrirDashboard() {
    const tbody = document.getElementById("tbody-etudiants");
    if (!tbody) return;

    tbody.innerHTML = ""; // Nettoyage préalable

    // Récupération du carnet global
    const etudiantsStr = localStorage.getItem("carnetEtudiants");
    const etudiants = etudiantsStr ? JSON.parse(etudiantsStr) : {};

    const nomsEtudiants = Object.keys(etudiants);

    if (nomsEtudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; padding: 30px; color: #7f8c8d;">
                    <i class="fas fa-user-slash" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                    Aucun élève enregistré sur cet ordinateur.
                </td>
            </tr>`;
    } else {
        nomsEtudiants.forEach(nom => {
            const user = etudiants[nom];
            let tempsHtml = "";
            let nbCours = 0;

            // Génération des badges de temps pour chaque cours
      for (const cours in user.tempsParCours) {
        const totalSec = user.tempsParCours[cours];
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
    
          // On force le badge à rester "tranquille" dans sa case avec un style Inline fort
          tempsHtml += `
          <span style="
            background: #34495e !important; 
            color: white !important; 
            padding: 4px 8px !important; 
            border-radius: 4px !important; 
            font-size: 0.75rem !important; 
            display: inline-block !important;
            position: static !important;
            margin: 2px !important;
            width: auto !important;
            height: auto !important;
            transform: none !important;
            box-shadow: none !important;">
            ${cours} : ${min}m ${sec}s</span>`;
          nbCours++;
          }

          // Création de la ligne du tableau
          const tr = document.createElement("tr");
          tr.style.borderBottom = "1px solid #eee";
          tr.innerHTML = `
            <td style="padding: 12px; font-weight: bold; color: #2c3e50; white-space: nowrap;">
                <i class="fas fa-user-graduate"></i> ${user.nom}
            </td>
            <td style="padding: 12px; text-align: center;">
              <span style="background: #ecf0f1; padding: 4px 10px; border-radius: 20px; font-weight: 600;">
                ${nbCours} / 10
              </span>
            </td>
            <td style="padding: 12px; display: flex; flex-wrap: wrap; gap: 5px; min-width: 250px;">
              ${tempsHtml || '<em style="color:#bdc3c7;">Aucun temps enregistré</em>'}
            </td>
          `;
          tbody.appendChild(tr);
      });
    }

    // Affichage de la modale
    document.getElementById("admin-dashboard").style.display = "flex";
}

/**
 * Ferme la fenêtre modale du dashboard
 */
function fermerDashboard() {
    const dashboard = document.getElementById("admin-dashboard");
    if (dashboard) dashboard.style.display = "none";
}

/**
 * Supprime TOUTES les données de progression de TOUS les élèves
 */
function effacerDonnees() {
    const confirmation = confirm("⚠️ ATTENTION\n\nCela va effacer définitivement la progression et les temps de TOUS les élèves sur cet ordinateur.\n\nContinuer ?");
    
    if (confirmation) {
        localStorage.removeItem("carnetEtudiants");
        // On peut aussi supprimer les "done" individuels si besoin
        ordreCours.forEach(c => localStorage.removeItem("cours-" + c));
        
        ouvrirDashboard(); // Rafraîchit l'affichage (affichera "Aucun élève")
    }
}

