/** * script.js - Gestion de la plateforme d'apprentissage
 * Inscription, Progression, Chronomètre et Mode Admin
 */

// ==========================================
// 1. CONFIGURATION ET SYSTÈME DE COURS
// ==========================================

let chronoDebut = 0;
/** Démarre le chrono quand on ouvre une page de cours */
function demarrerChrono() { chronoDebut = Date.now(); }

/** L'ordre exact des fichiers HTML pour la progression */
const ordreCours = ["pointeur", "barredefil", "informatique", "windows", "explorateur", "bureau", "clavier", "internet", "mail", "word", "excel", "powerpoint", ];

window.addEventListener("DOMContentLoaded", () => {
    chargerTheme();
    // Si on est sur l'accueil (présence de cartes), on gère la connexion et le visuel
    if (document.querySelector(".cours-card")) {
        verifierConnexion();
    }
});

// ==========================================
// 2. AUTHENTIFICATION (LOGIN / INSCRIPTION)
// ==========================================
let currentAuthMode = 'login';

/** Bascule entre l'onglet Connexion et Inscription */
function switchAuthMode(mode) {
    currentAuthMode = mode;
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    
    // Visuel des onglets
    tabLogin.classList.toggle('active', mode === 'login');
    tabRegister.classList.toggle('active', mode === 'register');
    
    // Affichage des zones
    document.getElementById('login-only-zone').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('register-only-zone').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-title').innerText = mode === 'login' ? 'Identification' : 'Nouvelle Inscription';
    
    // Cacher l'option formateur si inscription
    const adminLabel = document.getElementById('check-admin').parentElement;
    if(adminLabel) adminLabel.style.display = mode === 'login' ? 'inline-block' : 'none';
}

/** Gère la validation du formulaire (Entrée ou Inscription) */
function handleAuth() {
    const prenom = document.getElementById('login-nom').value.trim();
    if(!prenom) { alert("Veuillez entrer votre prénom"); return; }

    let carnet = JSON.parse(localStorage.getItem("carnetEtudiants") || "{}");

    if(currentAuthMode === 'register') {
        // --- INSCRIPTION : Génération d'un ID type BER-1234 ---
        const newID = prenom.toUpperCase().substring(0, 3) + "-" + Math.floor(1000 + Math.random() * 9000);
        let newUser = { nom: prenom, id: newID, isAdmin: false, tempsParCours: {} };
        
        carnet[prenom] = newUser;
        localStorage.setItem('carnetEtudiants', JSON.stringify(carnet));
        localStorage.setItem('utilisateurActuel', JSON.stringify(newUser));
        
        alert("✅ Inscription réussie !\n\nIMPORTANT : Notez votre Identifiant pour revenir :\n" + newID);
        location.reload();
    } else {
        // --- CONNEXION ---
        const isFormateur = document.getElementById('check-admin').checked;
        if(isFormateur) {
            if(document.getElementById('login-mdp').value === "1234") {
                localStorage.setItem('utilisateurActuel', JSON.stringify({ nom: prenom, isAdmin: true }));
                location.reload();
            } else { alert("Mot de passe formateur incorrect."); }
            return;
        }

        const enteredID = document.getElementById('login-id').value.trim().toUpperCase();
        if (carnet[prenom] && carnet[prenom].id === enteredID) {
            localStorage.setItem('utilisateurActuel', JSON.stringify(carnet[prenom]));
            location.reload();
        } else {
            alert("Prénom ou ID inconnu. Vérifiez bien l'orthographe ou inscrivez-vous !");
        }
    }
}

/** Déconnecte l'utilisateur actuel */
function seDeconnecter() {
    localStorage.removeItem("utilisateurActuel");
    location.reload();
}

// ==========================================
// 3. LOGIQUE DE PROGRESSION ET VERROUILLAGE
// ==========================================

function mettreAJourProgression() {
    let terminés = 0;
    let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
    
    // On synchronise le localStorage avec les temps enregistrés de l'utilisateur
    if (user && user.tempsParCours) {
        for (let cours in user.tempsParCours) {
            localStorage.setItem("cours-" + cours, "done");
        }
    }

    ordreCours.forEach((cours) => {
        if (localStorage.getItem("cours-" + cours) === "done") {
            terminés++;
            const badge = document.getElementById("badge-" + cours);
            if (badge) badge.style.display = "block";
        } else {
            const badge = document.getElementById("badge-" + cours);
            if (badge) badge.style.display = "none";
        }
    });

    const pourcent = Math.round((terminés / ordreCours.length) * 100);
    const fill = document.getElementById("progress-fill");
    const txt = document.getElementById("progress-text");
    if (fill) fill.style.width = pourcent + "%";
    if (txt) txt.innerText = pourcent + "%";
}

function appliquerVerrouillageVisuel() {
    let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
    
    // Tout débloquer pour l'ADMIN
    if (user && user.isAdmin) {
        document.querySelectorAll(".cours-card").forEach(c => {
            c.style.opacity = "1";
            c.style.filter = "none";
            const btn = c.querySelector('.btn-card');
            if(btn) btn.disabled = false;
        });
        return;
    }

    // Verrouillage séquentiel pour l'ÉLÈVE
    ordreCours.forEach((cours, index) => {
        const carte = document.getElementById("card-" + cours);
        const estFait = localStorage.getItem("cours-" + cours) === "done";
        const precedentFait = index === 0 ? true : localStorage.getItem("cours-" + ordreCours[index - 1]) === "done";

        if (carte) {
            if (estFait || precedentFait) {
                carte.style.opacity = "1";
                carte.style.filter = "none";
                const btn = carte.querySelector('.btn-card');
                if(btn) btn.disabled = false;
            } else {
                carte.style.opacity = "0.4";
                carte.style.filter = "grayscale(100%)";
                const btn = carte.querySelector('.btn-card');
                if(btn) btn.disabled = true;
            }
        }
    });
}

/** Valide le cours et sauve le temps */
function validerCours(cours) {
    let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
    if (user && !user.isAdmin) {
        let tempsSec = Math.floor((Date.now() - chronoDebut) / 1000);
        user.tempsParCours = user.tempsParCours || {};
        user.tempsParCours[cours] = tempsSec;
        
        let carnet = JSON.parse(localStorage.getItem("carnetEtudiants") || "{}");
        carnet[user.nom] = user;
        localStorage.setItem('carnetEtudiants', JSON.stringify(carnet));
        localStorage.setItem('utilisateurActuel', JSON.stringify(user));
    }
    
    localStorage.setItem("cours-" + cours, "done");
    
    // Modale de succès
    const div = document.createElement("div");
    div.className = "custom-confirm-overlay";
    div.innerHTML = `<div class="custom-confirm-box"><h2>🎉 Bravo !</h2><p>Cours validé. Retour à l'accueil...</p><button class="btn-card" id="btnOK">Continuer</button></div>`;
    document.body.appendChild(div);
    document.getElementById("btnOK").onclick = () => { window.location.href = "index.html"; };
}

// ==========================================
// 4. INTERFACE ET THÈME
// ==========================================

function verifierConnexion() {
    let userStr = localStorage.getItem("utilisateurActuel");
    if (!userStr) {
        document.getElementById("login-modal").style.display = "flex";
    } else {
        let user = JSON.parse(userStr);
        document.getElementById("login-modal").style.display = "none";
        document.getElementById("user-info").style.display = "block";
        document.getElementById("nom-affichage").innerText = user.nom;
        if(user.id) document.getElementById("id-affichage").innerText = "ID: " + user.id;

        if (user.isAdmin) {
            document.getElementById("badge-admin").style.display = "inline-block";
            document.getElementById("admin-access-zone").style.display = "block";
        }
        mettreAJourProgression();
        appliquerVerrouillageVisuel();
    }
}

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

function togglePassword() {
    const isChecked = document.getElementById("check-admin").checked;
    document.getElementById("login-mdp").style.display = isChecked ? "block" : "none";
}

function ouvrirCours(nom) { window.location.href = nom + ".html"; }
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
