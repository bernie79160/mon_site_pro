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
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('login-only-zone').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('register-only-zone').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-title').innerText = mode === 'login' ? 'Identification' : 'Nouvelle Inscription';
    
    const adminLabel = document.getElementById('check-admin').parentElement;
    if(adminLabel) adminLabel.style.display = mode === 'login' ? 'inline-block' : 'none';
}

function handleAuth() {
    const prenom = document.getElementById('login-nom').value.trim();
    if(!prenom) { alert("Veuillez entrer votre prénom"); return; }

    let carnet = JSON.parse(localStorage.getItem("carnetEtudiants") || "{}");

    if(currentAuthMode === 'register') {
        const newID = prenom.toUpperCase().substring(0, 3) + "-" + Math.floor(1000 + Math.random() * 9000);
        let newUser = { nom: prenom, id: newID, isAdmin: false, tempsParCours: {} };
        
        carnet[prenom] = newUser;
        localStorage.setItem('carnetEtudiants', JSON.stringify(carnet));
        localStorage.setItem('utilisateurActuel', JSON.stringify(newUser));
        
        alert("✅ Inscription réussie !\n\nIMPORTANT : Notez votre Identifiant :\n" + newID);
        location.reload();
    } else {
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
            alert("Prénom ou ID inconnu. Vérifiez bien l'orthographe !");
        }
    }
}

function seDeconnecter() {
    localStorage.removeItem("utilisateurActuel");
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
    
    const div = document.createElement("div");
    div.className = "custom-confirm-overlay";
    div.innerHTML = `<div class="custom-confirm-box"><h2>🎉 Bravo !</h2><p>Cours validé.</p><button class="btn-card" id="btnOK">Continuer</button></div>`;
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

function générerTableauAdmin() {
    const tbody = document.getElementById("tbody-etudiants");
    const etudiants = JSON.parse(localStorage.getItem("carnetEtudiants") || "{}");
    tbody.innerHTML = "";
    
    Object.values(etudiants).forEach(u => {
        let tempsHtml = "";
        for (let c in u.tempsParCours) {
            let s = u.tempsParCours[c];
            tempsHtml += `<span class="badge-temps" style="background:#34495e; color:white; padding:2px 6px; border-radius:4px; font-size:11px; margin-right:4px;">${c}: ${Math.floor(s/60)}m${s%60}s</span>`;
        }
        
        let tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #eee";
        tr.innerHTML = `
            <td style="padding:12px"><b>${u.nom}</b><br><small>${u.id}</small></td>
            <td style="padding:12px; text-align:center">${Object.keys(u.tempsParCours || {}).length} / 12</td>
            <td style="padding:12px">${tempsHtml || "Aucun cours"}</td>
        `;
        tbody.appendChild(tr);
    });
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
    document.getElementById("login-mdp").style.display = isChecked ? "block" : "none";
}

function ouvrirCours(nom) { window.location.href = nom + ".html"; }
function ouvrirDashboard() { document.getElementById("admin-dashboard").style.display = "flex"; générerTableauAdmin(); }
function fermerDashboard() { document.getElementById("admin-dashboard").style.display = "none"; }
