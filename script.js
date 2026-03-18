/** * script.js - Gestion de la plateforme d'apprentissage
 * Version corrigée : Progression, IDs, Temps Admin et Verrouillage
 */

// ==========================================
// 1. CONFIGURATION ET SYSTÈME DE COURS
// ==========================================

let chronoDebut = 0;
function demarrerChrono() { chronoDebut = Date.now(); }

const ordreCours = ["pointeur", "barredefil", "informatique", "windows", "explorateur", "bureau", "clavier", "internet", "mail", "word", "excel", "powerpoint"];

window.addEventListener("DOMContentLoaded", () => {
    chargerTheme();
    if (document.querySelector(".cours-card")) {
        verifierConnexion();
    }
});

// ==========================================
// 2. AUTHENTIFICATION (LOGIN / INSCRIPTION)
// ==========================================
let currentAuthMode = 'login';

function switchAuthMode(mode) {
    currentAuthMode = mode;
    
    // --- CORRECTIF : Si on passe en inscription, on décoche et on cache le mode formateur ---
    const checkAdmin = document.getElementById('check-admin');
    if (mode === 'register' && checkAdmin) {
        checkAdmin.checked = false;
        togglePassword(); // On remet l'affichage à zéro (cache le MDP)
    }

    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('login-only-zone').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('register-only-zone').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-title').innerText = mode === 'login' ? 'Identification' : 'Nouvelle Inscription';
    
    const adminLabel = document.getElementById('check-admin').parentElement;
    if(adminLabel) adminLabel.style.display = mode === 'login' ? 'inline-block' : 'none';
}

async function handleAuth() {
    console.log("--- DÉBUT AUTHENTIFICATION ---");
    const isFormateur = document.getElementById('check-admin').checked;
    let prenom = document.getElementById('login-nom').value.trim();

    if (isFormateur) {
        prenom = "Bernard"; 
    } else {
        if(!prenom) { alert("Veuillez entrer votre prénom"); return; }
    }

    // --- MODE INSCRIPTION ---
if(currentAuthMode === 'register') {
    console.log("Début de l'inscription pour:", prenom); // Message de contrôle
    const newID = prenom.toUpperCase().substring(0, 3) + "-" + Math.floor(1000 + Math.random() * 9000);
    let newUser = { nom: prenom, id: newID, isAdmin: false, tempsParCours: {} };
    
    try {
        const docRef = window.fbDoc(window.db, "eleves", prenom);
        console.log("Envoi à Firebase..."); 
        
        await window.fbSetDoc(docRef, newUser);
        
        console.log("Envoi réussi !");
        localStorage.setItem('utilisateurActuel', JSON.stringify(newUser));
        alert("✅ Inscription réussie !\n\nNote ton ID : " + newID);
        location.reload();
    } catch (e) {
        console.error("Erreur détaillée :", e); // Affiche l'erreur précise en rouge
        alert("Erreur Firebase : " + e.message);
    }

    } else {
        if(isFormateur) {
            if(document.getElementById('login-mdp').value === "1234") {
                localStorage.setItem('utilisateurActuel', JSON.stringify({ nom: prenom, isAdmin: true }));
                location.reload();
            } else { alert("Mot de passe formateur incorrect."); }
            return;
        }

        const enteredID = document.getElementById('login-id').value.trim().toUpperCase();
        
        try {
            // On va chercher le document de l'élève sur Firebase
            const docRef = window.fbDoc(window.db, "eleves", prenom);
            const docSnap = await window.fbGetDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.id === enteredID) {
                 // On enregistre les données venues du Cloud dans le navigateur
                localStorage.setItem('utilisateurActuel', JSON.stringify(userData));
    
                 // On force le nettoyage des vieux badges locaux pour mettre les vrais
                ordreCours.forEach(c => localStorage.removeItem("cours-" + c));
                if (userData.tempsParCours) {
                    Object.keys(userData.tempsParCours).forEach(cours => {
                    localStorage.setItem("cours-" + cours, "done");
                    });
                }

                alert("Bonjour " + prenom + " ! Connexion réussie.");
                location.reload();
                } else {
                    alert("ID incorrect pour ce prénom.");
                }
            } else {
                alert("Aucun compte trouvé au nom de : " + prenom);
            }
        } catch (e) {
            alert("Erreur de connexion : " + e.message);
        }
    }
}

function seDeconnecter() {
    localStorage.removeItem("utilisateurActuel");
    // 2. ON DÉCOCHE LA CASE FORMATEUR (La ligne à ajouter)
    const checkAdmin = document.getElementById("check-admin");
    if (checkAdmin) {
        checkAdmin.checked = false;
    }

    // 3. On cache aussi le mot de passe s'il était affiché
    const mdpInput = document.getElementById("login-mdp");
    if (mdpInput) {
        mdpInput.style.display = "none";
    }
    // On nettoie aussi les marqueurs de cours pour le prochain
    ordreCours.forEach(c => localStorage.removeItem("cours-" + c));
    location.reload();
}

// ==========================================
// 3. LOGIQUE DE PROGRESSION ET VERROUILLAGE
// ==========================================

function mettreAJourProgression() {
    let terminés = 0;
    let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
    
    // On restaure les "done" depuis l'objet utilisateur
    if (user && user.tempsParCours) {
        Object.keys(user.tempsParCours).forEach(cours => {
            localStorage.setItem("cours-" + cours, "done");
        });
    }

    ordreCours.forEach((cours) => {
        const badge = document.getElementById("badge-" + cours);
        if (localStorage.getItem("cours-" + cours) === "done") {
            terminés++;
            if (badge) badge.style.display = "block";
        } else {
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
    
    if (user && user.isAdmin) {
        document.querySelectorAll(".cours-card").forEach(c => {
            c.style.opacity = "1";
            c.style.filter = "none";
            const btn = c.querySelector('.btn-card');
            if(btn) btn.disabled = false;
        });
        return;
    }

    ordreCours.forEach((cours, index) => {
        const carte = document.getElementById("card-" + cours);
        const estFait = localStorage.getItem("cours-" + cours) === "done";
        const precedentFait = index === 0 ? true : localStorage.getItem("cours-" + ordreCours[index - 1]) === "done";

        if (carte) {
            const btn = carte.querySelector('.btn-card');
            if (estFait || precedentFait) {
                carte.style.opacity = "1";
                carte.style.filter = "none";
                if(btn) btn.disabled = false;
            } else {
                carte.style.opacity = "0.4";
                carte.style.filter = "grayscale(100%)";
                if(btn) btn.disabled = true;
            }
        }
    });
}

async function validerCours(cours) {
    let user = JSON.parse(localStorage.getItem("utilisateurActuel"));
    if (user && !user.isAdmin) {
        let tempsSec = Math.floor((Date.now() - chronoDebut) / 1000);
        
        // On prépare les données à envoyer
        user.tempsParCours = user.tempsParCours || {};
        user.tempsParCours[cours] = tempsSec;

        // 1. Sauvegarde locale (pour l'affichage immédiat)
        localStorage.setItem("cours-" + cours, "done");
        localStorage.setItem('utilisateurActuel', JSON.stringify(user));

        // 2. SAUVEGARDE SUR FIREBASE (Le plus important)
        await sauvegarderDonnees({
            tempsParCours: user.tempsParCours
        });
    } else {
        localStorage.setItem("cours-" + cours, "done");
    }
    
    // Affichage du message de succès
    const div = document.createElement("div");
    div.className = "custom-confirm-overlay";
    div.innerHTML = `<div class="custom-confirm-box"><h2>🎉 Bravo !</h2><p>Cours validé et sauvegardé.</p><button class="btn-card" id="btnOK">Continuer</button></div>`;
    document.body.appendChild(div);
    document.getElementById("btnOK").onclick = () => { window.location.href = "index.html"; };
}

// ==========================================
// 4. INTERFACE ET DASHBOARD
// ==========================================

function verifierConnexion() {
    let userStr = localStorage.getItem("utilisateurActuel");
    if (!userStr) {
        document.getElementById("login-modal").style.display = "flex";
    } else {
        let user = JSON.parse(userStr);
        document.getElementById("login-modal").style.display = "none";
        document.getElementById("user-info").style.display = "flex";
        document.getElementById("nom-affichage").innerText = user.nom;
        if(user.id) document.getElementById("id-affichage").innerText = "ID: " + user.id;
        
        if (user.isAdmin) {
            const btnAdmin = document.getElementById("admin-access-zone");
            if (btnAdmin) {
                btnAdmin.style.setProperty("display", "inline-block", "important");
            }
        }
        mettreAJourProgression();
        appliquerVerrouillageVisuel();
    }
}

async function générerTableauAdmin() {
    const tbody = document.getElementById("tbody-etudiants");
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Chargement...</td></tr>";
    
    try {
        const querySnapshot = await window.fbGetDocs(window.fbCollection(window.db, "eleves"));
        tbody.innerHTML = "";
        
        querySnapshot.forEach((docSnapshot) => {
            const u = docSnapshot.data();
            const nomDoc = docSnapshot.id; // C'est le prénom utilisé comme clé
            let tempsHtml = "";
            for (let c in u.tempsParCours) {
                let s = u.tempsParCours[c];
                tempsHtml += `<span class="badge-temps">${c}: ${Math.floor(s/60)}m${s%60}s</span>`;
            }
            
            let tr = document.createElement("tr");
            tr.innerHTML = `
                <td style="padding:12px"><b>${u.nom}</b><br><small>${u.id}</small></td>
                <td style="padding:12px; text-align:center">${Object.keys(u.tempsParCours || {}).length} / 12</td>
                <td style="padding:12px">${tempsHtml || "Aucun cours"}</td>
                <td style="padding:12px; text-align:center">
                    <button onclick="supprimerEleveCloud('${nomDoc}')" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = "<tr><td colspan='4'>Erreur Firebase.</td></tr>";
    }
}

// La fonction magique pour supprimer dans le Cloud
async function supprimerEleveCloud(prenom) {
    if(confirm("Supprimer définitivement " + prenom + " ?")) {
        try {
            // On utilise window.fbDeleteDoc que tu as défini dans ton index.html
            await window.fbDeleteDoc(window.fbDoc(window.db, "eleves", prenom));
            alert("Élève supprimé !");
            générerTableauAdmin(); 
        } catch (e) {
            alert("Erreur : " + e.message);
        }
    }
}

function effacerDonnees() {
    if(confirm("Supprimer tous les élèves de cette machine ?")) {
        localStorage.removeItem("carnetEtudiants");
        générerTableauAdmin();
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
    const mdpInput = document.getElementById("login-mdp");
    const loginNom = document.getElementById("login-nom");
    const loginIdZone = document.getElementById("login-only-zone");

    if (isChecked) {
        // Mode Formateur
        mdpInput.style.display = "block";
        loginNom.style.display = "none";   // On cache le prénom
        if(loginIdZone) loginIdZone.style.display = "none"; // On cache l'ID
    } else {
        // Mode Élève
        mdpInput.style.display = "none";
        loginNom.style.display = "block";  // On réaffiche le prénom
        if(currentAuthMode === 'login') {
            if(loginIdZone) loginIdZone.style.display = "block";
        }
    }
}

// Fonction pour sauvegarder n'importe quelle donnée sur Firebase
async function sauvegarderDonnees(donnees) {
    const user = JSON.parse(localStorage.getItem('utilisateurActuel'));
    if (!user || user.isAdmin) return; // On ne sauvegarde pas si c'est Bernard ou si personne n'est connecté

    try {
        const docRef = window.fbDoc(window.db, "eleves", user.nom);
        await window.fbUpdateDoc(docRef, donnees);
        console.log("☁️ Firebase mis à jour :", donnees);
    } catch (e) {
        console.error("Erreur de sauvegarde :", e);
    }
}

function ouvrirCours(nom) { window.location.href = nom + ".html"; }
function ouvrirDashboard() { document.getElementById("admin-dashboard").style.display = "flex"; générerTableauAdmin(); }
function fermerDashboard() { document.getElementById("admin-dashboard").style.display = "none"; }