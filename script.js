/** * script.js - Gestion de la plateforme d'apprentissage
 * Version corrigée : Progression, IDs, Temps Admin et Verrouillage
 */

// ==========================================
// 1. CONFIGURATION ET SYSTÈME DE COURS
// ==========================================

let chronoDebut = 0;
function demarrerChrono() { chronoDebut = Date.now(); }

const ordreCours = ["pointeur", "barredefil", "informatique", "windows", "explorateur", "bureau", "clavier", "internet", "mail", "word", "excel", "powerpoint"];
const API_BASE_URL = localStorage.getItem("apiBaseUrl") || `http://${window.location.hostname || 'localhost'}:3001`;
let moduleIdBySlug = null;

window.setApiBaseUrl = function(url) {
    if (!url) return;
    localStorage.setItem("apiBaseUrl", url);
};

window.resetApiBaseUrl = function() {
    localStorage.removeItem("apiBaseUrl");
};

function getAuthToken() {
    return localStorage.getItem("authToken");
}

function setSessionUtilisateur(token, user) {
    if (token) {
        localStorage.setItem("authToken", token);
    }

    if (user) {
        const userLocal = {
            nom: user.prenom || user.nom,
            id: user.eleveCode || user.id,
            isAdmin: user.role === "ADMIN" || user.role === "FORMATEUR",
            visitCount: user.visitCount || 0,
            tempsParCours: user.tempsParCours || {}
        };
        localStorage.setItem("utilisateurActuel", JSON.stringify(userLocal));
    }
}

function afficherCompteurVisites(count) {
    const el = document.getElementById("visites-affichage");
    if (!el) return;
    const value = Number.isFinite(count) ? count : 0;
    el.innerText = "Visites: " + value;
}

function getProchainCoursConseille() {
    for (const cours of ordreCours) {
        if (localStorage.getItem("cours-" + cours) !== "done") return cours;
    }
    return "Tous les cours du niveau sont terminés 🎉";
}

function ouvrirAideEleve() {
    const modal = document.getElementById("modal-aide-eleve");
    if (!modal) return;
    const prochain = document.getElementById("aide-prochain-cours");
    if (prochain) {
        prochain.innerText = "Prochain cours conseillé: " + getProchainCoursConseille();
    }
    modal.style.display = "flex";
}

function fermerAideEleve() {
    const modal = document.getElementById("modal-aide-eleve");
    if (!modal) return;
    modal.style.display = "none";
}

window.ouvrirAideEleve = ouvrirAideEleve;
window.fermerAideEleve = fermerAideEleve;

function viderSessionUtilisateur() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("utilisateurActuel");
}

async function apiFetch(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getAuthToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
        const message = payload?.message || `Erreur API ${response.status}`;
        throw new Error(message);
    }

    return payload;
}

async function chargerCatalogueModules() {
    if (moduleIdBySlug) return moduleIdBySlug;

    const modules = await apiFetch("/modules");
    moduleIdBySlug = {};
    modules.forEach((moduleItem) => {
        moduleIdBySlug[moduleItem.slug] = moduleItem.id;
    });
    return moduleIdBySlug;
}

async function synchroniserProgressionDepuisAPI() {
    if (!getAuthToken()) return;

    try {
        const progressions = await apiFetch("/progressions/me");
        ordreCours.forEach((cours) => localStorage.removeItem("cours-" + cours));

        progressions.forEach((p) => {
            if (p.etat === "DONE" && p.module?.slug) {
                localStorage.setItem("cours-" + p.module.slug, "done");
            }
        });
    } catch (e) {
        console.warn("Synchronisation progression indisponible:", e.message);
    }
}

async function sauvegarderProgressionAPI(cours, tempsSec) {
    if (!getAuthToken()) return;

    const mapModules = await chargerCatalogueModules();
    const moduleId = mapModules[cours];
    if (!moduleId) return;

    await apiFetch(`/progressions/me/${moduleId}`, {
        method: "PUT",
        body: JSON.stringify({ etat: "DONE", tempsSec })
    });
}

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

    togglePassword();
}

async function handleAuth() {
    console.log("--- DÉBUT AUTHENTIFICATION ---");
    const isFormateur = document.getElementById('check-admin').checked;
    let prenom = document.getElementById('login-nom').value.trim();

    if(!prenom) {
        alert(isFormateur && currentAuthMode === 'login' ? "Veuillez entrer votre email formateur" : "Veuillez compléter les informations demandées");
        return;
    }

    // --- MODE INSCRIPTION ---
if(currentAuthMode === 'register') {
    if (isFormateur) {
        const nom = (document.getElementById('register-formateur-nom')?.value || '').trim();
        const email = (document.getElementById('register-formateur-email')?.value || '').trim();
        const password = (document.getElementById('login-mdp')?.value || '').trim();

        if (!prenom || !nom || !email || password.length < 8) {
            alert("Veuillez renseigner prénom, nom, email et un mot de passe d'au moins 8 caractères.");
            return;
        }

        try {
            const response = await apiFetch('/auth/bootstrap-formateur', {
                method: 'POST',
                body: JSON.stringify({ prenom, nom, email, password })
            });

            setSessionUtilisateur(response.token, response.user);
            alert("✅ Compte formateur créé. Vous êtes maintenant connecté.");
            location.reload();
        } catch (e) {
            alert("Erreur création formateur : " + e.message);
        }
        return;
    }

    try {
        const inviteCode = (document.getElementById('register-invite-code')?.value || '').trim().toUpperCase();
        const response = await apiFetch('/auth/register-eleve', {
            method: 'POST',
            body: JSON.stringify({ prenom, nom: prenom, inviteCode: inviteCode || null })
        });

        setSessionUtilisateur(response.token, response.user);
        ordreCours.forEach(c => localStorage.removeItem("cours-" + c));
        alert("✅ Inscription réussie !\n\nNote ton ID : " + response.user.eleveCode);
        location.reload();
    } catch (e) {
        alert("Erreur inscription : " + e.message);
    }

    } else {
        if(isFormateur) {
            const password = document.getElementById('login-mdp').value;

            try {
                const response = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: prenom, password })
                });

                if (!(response.user?.role === 'FORMATEUR' || response.user?.role === 'ADMIN')) {
                    alert("Ce compte n'a pas les droits formateur.");
                    return;
                }

                setSessionUtilisateur(response.token, response.user);
                alert("Connexion formateur réussie.");
                location.reload();
            } catch (e) {
                if (password === "1234") {
                    localStorage.removeItem("authToken");
                    localStorage.setItem('utilisateurActuel', JSON.stringify({ nom: "Bernard", isAdmin: true }));
                    alert("Mode formateur local activé (sans API).");
                    location.reload();
                } else {
                    alert("Connexion formateur impossible: " + e.message);
                }
            }
            return;
        }

        const enteredID = document.getElementById('login-id').value.trim().toUpperCase();
        
        try {
            const response = await apiFetch('/auth/login-eleve', {
                method: 'POST',
                body: JSON.stringify({ prenom, eleveCode: enteredID })
            });

            setSessionUtilisateur(response.token, response.user);
            await synchroniserProgressionDepuisAPI();
            alert("Bonjour " + prenom + " ! Connexion réussie.");
            location.reload();
        } catch (e) {
            alert("Erreur de connexion : " + e.message);
        }
    }
}

function seDeconnecter() {
    viderSessionUtilisateur();
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

        // 2. SAUVEGARDE API + compatibilité Firebase
        try {
            await sauvegarderProgressionAPI(cours, tempsSec);
        } catch (e) {
            console.warn("Sauvegarde API indisponible:", e.message);
        }

        await sauvegarderDonnees({
            tempsParCours: user.tempsParCours
        });
    } else {
        localStorage.setItem("cours-" + cours, "done");
    }
    
    // Affichage du message de succès ou lancement QCM
    await lancerQCMApresModule(cours);
}

/**
 * Tente de démarrer un QCM après validation du module.
 * Si aucun test dispo, affiche le message de succès classique.
 */
async function lancerQCMApresModule(coursSlug) {
    const token = getAuthToken();
    if (!token) {
        afficherSuccesCours(); return;
    }

    // Récupérer l'id du module depuis le cache
    let moduleId = null;
    try {
        if (!moduleIdBySlug) await chargerCatalogueModules();
        moduleId = moduleIdBySlug?.[coursSlug];
    } catch (_) {}

    if (!moduleId) { afficherSuccesCours(); return; }

    let testData = null;
    try {
        testData = await apiFetch(`/tests/${moduleId}/tentatives`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    } catch (e) {
        // Pas de test dispo → succès classique
        afficherSuccesCours(); return;
    }

    if (!testData || !testData.questions?.length) {
        afficherSuccesCours(); return;
    }

    afficherQCM(testData);
}

function afficherSuccesCours() {
    const div = document.createElement("div");
    div.className = "custom-confirm-overlay";
    div.innerHTML = `<div class="custom-confirm-box"><h2>🎉 Bravo !</h2><p>Cours validé et sauvegardé.</p><button class="btn-card" id="btnOK">Continuer</button></div>`;
    document.body.appendChild(div);
    document.getElementById("btnOK").onclick = () => { window.location.href = "index.html"; };
}

function afficherQCM(testData) {
    let current = 0;
    const { tentativeId, questions, dureeSec, maxScore } = testData;
    const reponses = {};

    function renderQuestion() {
        const q = questions[current];
        const opts = Array.isArray(q.options) ? q.options : [];
        const optionsHtml = opts.map((opt, i) => `
            <label class="qcm-option" style="display:block;margin:8px 0;cursor:pointer;">
                <input type="radio" name="qcm_opt" value="${escapeHtml(opt)}" style="margin-right:8px;">
                ${escapeHtml(opt)}
            </label>`).join('');

        document.getElementById("qcm-body").innerHTML = `
            <p style="font-weight:600;margin-bottom:12px;">${current + 1}/${questions.length} — ${escapeHtml(q.intitule)}</p>
            <div id="qcm-opts">${optionsHtml}</div>
            <p style="color:#888;font-size:.85em;margin-top:12px;">Points : ${q.points}</p>`;

        // Pré-sélectionner si déjà répondu
        if (reponses[q.id]) {
            const radios = document.querySelectorAll('input[name="qcm_opt"]');
            radios.forEach(r => { if (r.value === reponses[q.id]) r.checked = true; });
        }
    }

    const overlay = document.createElement("div");
    overlay.className = "custom-confirm-overlay";
    overlay.id = "qcm-overlay";
    overlay.innerHTML = `
        <div class="custom-confirm-box" style="max-width:540px;width:90%;max-height:90vh;overflow-y:auto;">
            <h2 style="margin-bottom:16px;">📝 Quiz de fin de module</h2>
            <div id="qcm-body"></div>
            <div style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end;">
                <button class="btn-card" id="qcm-prev" style="background:#888;">← Précédent</button>
                <button class="btn-card" id="qcm-next">Suivant →</button>
                <button class="btn-card" id="qcm-submit" style="display:none;background:#27ae60;">✅ Valider</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    renderQuestion();

    document.getElementById("qcm-prev").onclick = () => {
        const sel = document.querySelector('input[name="qcm_opt"]:checked');
        if (sel) reponses[questions[current].id] = sel.value;
        if (current > 0) { current--; renderQuestion(); }
        updateNav();
    };

    document.getElementById("qcm-next").onclick = () => {
        const sel = document.querySelector('input[name="qcm_opt"]:checked');
        if (sel) reponses[questions[current].id] = sel.value;
        if (current < questions.length - 1) { current++; renderQuestion(); }
        updateNav();
    };

    function updateNav() {
        document.getElementById("qcm-prev").style.display = current === 0 ? "none" : "";
        document.getElementById("qcm-next").style.display = current === questions.length - 1 ? "none" : "";
        document.getElementById("qcm-submit").style.display = current === questions.length - 1 ? "" : "none";
    }
    updateNav();

    document.getElementById("qcm-submit").onclick = async () => {
        const sel = document.querySelector('input[name="qcm_opt"]:checked');
        if (sel) reponses[questions[current].id] = sel.value;

        const payload = questions.map(q => ({
            questionId: q.id,
            reponse: reponses[q.id] ?? null
        }));

        let result;
        try {
            result = await apiFetch(`/tentatives/${tentativeId}/submit`, {
                method: 'POST',
                body: JSON.stringify({ reponses: payload })
            });
        } catch (e) {
            overlay.remove();
            afficherSuccesCours(); return;
        }

        overlay.remove();
        afficherResultatQCM(result);
    };
}

function afficherResultatQCM(result) {
    const { score, maxScore, pourcentage, reussi, detail } = result;
    const emoji = reussi ? "🎉" : "📚";
    const msg = reussi ? "Bravo, vous avez réussi le quiz !" : "Continuez à vous entraîner !";

    let detailHtml = detail.map(r => {
        const icone = r.estCorrecte ? "✅" : "❌";
        return `<li style="margin:4px 0">${icone} ${r.estCorrecte ? "Correct" : `Incorrect — bonne réponse : <strong>${escapeHtml(r.bonneReponse ?? '?')}</strong>`}</li>`;
    }).join('');

    const div = document.createElement("div");
    div.className = "custom-confirm-overlay";
    div.innerHTML = `
        <div class="custom-confirm-box" style="max-width:480px;width:90%;max-height:90vh;overflow-y:auto;">
            <h2>${emoji} Résultat du quiz</h2>
            <p style="font-size:1.4em;margin:12px 0;"><strong>${score} / ${maxScore}</strong> (${pourcentage}%)</p>
            <p>${msg}</p>
            <ul style="text-align:left;margin:16px 0;">${detailHtml}</ul>
            <button class="btn-card" id="btnQCMOK">Retour au catalogue</button>
        </div>`;
    document.body.appendChild(div);
    document.getElementById("btnQCMOK").onclick = () => { window.location.href = "index.html"; };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function afficherExplicationErreur({ titre, erreur, pourquoi, correction, astuce }) {
    const overlay = document.createElement("div");
    overlay.className = "custom-confirm-overlay";
    overlay.innerHTML = `
        <div class="custom-confirm-box" style="max-width:520px;width:92%;text-align:left;">
            <h2 style="margin-top:0;color:#e67e22;">${escapeHtml(titre || '⚠️ Explication')}</h2>
            <p><strong>Erreur :</strong> ${escapeHtml(erreur || 'Une erreur a été détectée.')}</p>
            <p><strong>Pourquoi ?</strong> ${escapeHtml(pourquoi || 'Cette action peut poser un problème de sécurité ou de logique.')}</p>
            <p><strong>Comment corriger :</strong> ${escapeHtml(correction || 'Essayez une autre réponse en suivant la consigne.')}</p>
            <p style="background:#f8f9fa;padding:8px 10px;border-radius:6px;"><strong>Astuce :</strong> ${escapeHtml(astuce || 'Prenez le temps de relire les indices de l\'exercice.')}</p>
            <div style="text-align:right;margin-top:12px;">
                <button class="btn-card" id="btnCloseErreur" style="width:auto;padding:10px 16px;">J'ai compris</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const btnClose = overlay.querySelector('#btnCloseErreur');
    if (btnClose) {
        btnClose.onclick = () => overlay.remove();
    }
}

window.afficherExplicationErreur = afficherExplicationErreur;

// ==========================================
// 4. INTERFACE ET DASHBOARD
// ==========================================

async function verifierConnexion() {
    let userStr = localStorage.getItem("utilisateurActuel");
    if (!userStr) {
        document.getElementById("login-modal").style.display = "flex";
    } else {
        let user = JSON.parse(userStr);

        if (!user.isAdmin && getAuthToken()) {
            try {
                const me = await apiFetch('/me');
                user.nom = me.prenom || user.nom;
                user.id = me.eleveCode || user.id;
                user.visitCount = me.visitCount || user.visitCount || 0;
                localStorage.setItem("utilisateurActuel", JSON.stringify(user));
                await synchroniserProgressionDepuisAPI();
            } catch (e) {
                console.warn("Session API non rafraîchie:", e.message);
            }
        }

        document.getElementById("login-modal").style.display = "none";
        document.getElementById("user-info").style.display = "flex";
        document.getElementById("nom-affichage").innerText = user.nom;
        if(user.id) document.getElementById("id-affichage").innerText = "ID: " + user.id;
        afficherCompteurVisites(user.visitCount || 0);
        
        if (user.isAdmin) {
            const btnAdmin = document.getElementById("admin-access-zone");
            if (btnAdmin) {
                btnAdmin.style.setProperty("display", "inline-block", "important");
            }
        }
        mettreAJourProgression();
        appliquerVerrouillageVisuel();
        await chargerParcoursWordNiveaux();
        await chargerParcoursExcelNiveaux();
        await chargerParcoursPowerPointNiveaux();
    }
}

async function chargerParcoursWordNiveaux() {
    const section = document.getElementById("word-levels-section");
    const status = document.getElementById("word-levels-status");
    const grid = document.getElementById("word-levels-grid");
    if (!section || !status || !grid) return;

    if (!getAuthToken()) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";

    const attendu = [
        { slug: 'word-n1', label: 'Niveau 1', fallbackPath: 'word_n1.html', desc: 'Mise en forme guidée' },
        { slug: 'word-n2', label: 'Niveau 2', fallbackPath: 'word_n2.html', desc: 'Structurer un document' },
        { slug: 'word-n3', label: 'Niveau 3', fallbackPath: 'word_n3.html', desc: 'Document professionnel' }
    ];

    try {
        const modules = await apiFetch('/modules');
        const map = new Map(modules.map((m) => [m.slug, m]));
        const accessibles = attendu.filter((w) => map.has(w.slug)).length;
        status.innerText = `Word niveaux accessibles: ${accessibles}/3`;

        grid.innerHTML = attendu.map((w) => {
            const moduleData = map.get(w.slug);
            const unlocked = Boolean(moduleData);
            const done = localStorage.getItem("cours-" + w.slug) === "done";
            const sourcePath = moduleData?.sourcePath || w.fallbackPath;

            return `
                <div class="cours-card theme-word" style="${unlocked ? '' : 'opacity:.45;filter:grayscale(100%);'}">
                    <span class="badge-succes" style="display:${done ? 'block' : 'none'};"><i class="fas fa-medal"></i> Terminé</span>
                    <i class="fas fa-file-word"></i>
                    <h3>Word ${escapeHtml(w.label)}</h3>
                    <p>${escapeHtml(moduleData?.titre || w.desc)}</p>
                    <button class="btn-card" ${unlocked ? '' : 'disabled'} onclick="ouvrirCoursDepuisPath('${escapeHtml(sourcePath)}')">
                        ${unlocked ? 'Commencer' : 'Verrouillé'}
                    </button>
                </div>`;
        }).join('');
    } catch (e) {
        status.innerText = "Impossible de charger les niveaux Word: " + e.message;
        grid.innerHTML = "";
    }
}

async function chargerParcoursExcelNiveaux() {
    const section = document.getElementById("excel-levels-section");
    const status = document.getElementById("excel-levels-status");
    const grid = document.getElementById("excel-levels-grid");
    if (!section || !status || !grid) return;

    if (!getAuthToken()) { section.style.display = "none"; return; }
    section.style.display = "block";

    const attendu = [
        { slug: 'excel-n1', label: 'Niveau 1', fallbackPath: 'excel_n1.html', desc: 'Saisie et formules de base' },
        { slug: 'excel-n2', label: 'Niveau 2', fallbackPath: 'excel_n2.html', desc: 'Mise en forme et fonctions' },
        { slug: 'excel-n3', label: 'Niveau 3', fallbackPath: 'excel_n3.html', desc: 'Graphiques et analyse' }
    ];

    try {
        const modules = await apiFetch('/modules');
        const map = new Map(modules.map((m) => [m.slug, m]));
        const accessibles = attendu.filter((w) => map.has(w.slug)).length;
        status.innerText = `Excel niveaux accessibles : ${accessibles}/3`;

        grid.innerHTML = attendu.map((w) => {
            const moduleData = map.get(w.slug);
            const unlocked = Boolean(moduleData);
            const done = localStorage.getItem("cours-" + w.slug) === "done";
            const sourcePath = moduleData?.sourcePath || w.fallbackPath;
            return `
                <div class="cours-card theme-excel" style="${unlocked ? '' : 'opacity:.45;filter:grayscale(100%);'}">
                    <span class="badge-succes" style="display:${done ? 'block' : 'none'};"><i class="fas fa-medal"></i> Terminé</span>
                    <i class="fas fa-file-excel"></i>
                    <h3>Excel ${escapeHtml(w.label)}</h3>
                    <p>${escapeHtml(moduleData?.titre || w.desc)}</p>
                    <button class="btn-card" ${unlocked ? '' : 'disabled'} onclick="ouvrirCoursDepuisPath('${escapeHtml(sourcePath)}')">
                        ${unlocked ? 'Commencer' : 'Verrouillé'}
                    </button>
                </div>`;
        }).join('');
    } catch (e) {
        status.innerText = "Impossible de charger les niveaux Excel : " + e.message;
        grid.innerHTML = "";
    }
}

async function chargerParcoursPowerPointNiveaux() {
    const section = document.getElementById("powerpoint-levels-section");
    const status = document.getElementById("powerpoint-levels-status");
    const grid = document.getElementById("powerpoint-levels-grid");
    if (!section || !status || !grid) return;

    if (!getAuthToken()) { section.style.display = "none"; return; }
    section.style.display = "block";

    const attendu = [
        { slug: 'powerpoint-n1', label: 'Niveau 1', fallbackPath: 'powerpoint_n1.html', desc: 'Créer une présentation' },
        { slug: 'powerpoint-n2', label: 'Niveau 2', fallbackPath: 'powerpoint_n2.html', desc: 'Mise en page et thèmes' },
        { slug: 'powerpoint-n3', label: 'Niveau 3', fallbackPath: 'powerpoint_n3.html', desc: 'Animations et diaporama' }
    ];

    try {
        const modules = await apiFetch('/modules');
        const map = new Map(modules.map((m) => [m.slug, m]));
        const accessibles = attendu.filter((w) => map.has(w.slug)).length;
        status.innerText = `PowerPoint niveaux accessibles : ${accessibles}/3`;

        grid.innerHTML = attendu.map((w) => {
            const moduleData = map.get(w.slug);
            const unlocked = Boolean(moduleData);
            const done = localStorage.getItem("cours-" + w.slug) === "done";
            const sourcePath = moduleData?.sourcePath || w.fallbackPath;
            return `
                <div class="cours-card theme-powerpoint" style="${unlocked ? '' : 'opacity:.45;filter:grayscale(100%);'}">
                    <span class="badge-succes" style="display:${done ? 'block' : 'none'};"><i class="fas fa-medal"></i> Terminé</span>
                    <i class="fas fa-file-powerpoint"></i>
                    <h3>PowerPoint ${escapeHtml(w.label)}</h3>
                    <p>${escapeHtml(moduleData?.titre || w.desc)}</p>
                    <button class="btn-card" ${unlocked ? '' : 'disabled'} onclick="ouvrirCoursDepuisPath('${escapeHtml(sourcePath)}')">
                        ${unlocked ? 'Commencer' : 'Verrouillé'}
                    </button>
                </div>`;
        }).join('');
    } catch (e) {
        status.innerText = "Impossible de charger les niveaux PowerPoint : " + e.message;
        grid.innerHTML = "";
    }
}

// ═══════════════════════════════════════════════════════════
// CRUD COURS — Espace Formateur
// ═══════════════════════════════════════════════════════════

async function chargerTableauCours() {
    const tbody = document.getElementById("tbody-cours-admin");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='7' style='padding:10px;color:#777;'>Chargement...</td></tr>";
    try {
        const modules = await apiFetch('/modules');
        if (!modules.length) {
            tbody.innerHTML = "<tr><td colspan='7' style='padding:10px;color:#777;'>Aucun cours.</td></tr>";
            return;
        }
        tbody.innerHTML = modules.map(m => {
            const niveauBadge = m.niveau > 0
                ? `<span style="background:#8e44ad;color:white;border-radius:10px;padding:2px 8px;font-size:0.75rem;">N${m.niveau}</span>`
                : `<span style="background:#27ae60;color:white;border-radius:10px;padding:2px 8px;font-size:0.75rem;">Libre</span>`;
            const actifBadge = m.actif
                ? `<span style="color:#27ae60;">✔ Oui</span>`
                : `<span style="color:#e74c3c;">✘ Non</span>`;
            return `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;font-family:monospace;font-size:0.8rem;">${escapeHtml(m.slug)}</td>
                <td style="padding:8px;">${escapeHtml(m.titre)}</td>
                <td style="padding:8px;text-align:center;">${escapeHtml(m.categorie || '—')}</td>
                <td style="padding:8px;text-align:center;">${niveauBadge}</td>
                <td style="padding:8px;text-align:center;">${m.ordre}</td>
                <td style="padding:8px;text-align:center;">${actifBadge}</td>
                <td style="padding:8px;text-align:center;white-space:nowrap;">
                    <button class="btn-card" style="margin:0 2px;padding:4px 10px;font-size:0.8rem;width:auto;background:#2980b9;" onclick="editerCours(${JSON.stringify(JSON.stringify(m))})">✏️</button>
                    <button class="btn-card" style="margin:0 2px;padding:4px 10px;font-size:0.8rem;width:auto;background:#${m.actif ? 'e67e22' : '27ae60'};" onclick="toggleActifCours('${m.id}',${!m.actif})">${m.actif ? '⏸' : '▶'}</button>
                    <button class="btn-card" style="margin:0 2px;padding:4px 10px;font-size:0.8rem;width:auto;background:#e74c3c;" onclick="supprimerCours('${m.id}','${escapeHtml(m.titre)}')">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan='7' style='padding:10px;color:#e74c3c;'>Erreur: ${escapeHtml(e.message)}</td></tr>`;
    }
}

function editerCours(mJson) {
    const m = JSON.parse(mJson);
    document.getElementById('cours-edit-id').value = m.id;
    document.getElementById('cours-slug').value = m.slug;
    document.getElementById('cours-slug').disabled = true;
    document.getElementById('cours-titre-input').value = m.titre;
    document.getElementById('cours-categorie').value = m.categorie || '';
    document.getElementById('cours-niveau').value = m.niveau ?? 0;
    document.getElementById('cours-ordre').value = m.ordre;
    document.getElementById('cours-source').value = m.sourcePath || '';
    document.getElementById('form-cours-titre').innerHTML = '<i class="fas fa-edit"></i> Modifier le cours : ' + escapeHtml(m.titre);
    document.getElementById('cours-form-status').style.display = 'none';
    document.getElementById('form-cours-wrapper').scrollIntoView({ behavior: 'smooth' });
}

function annulerEditCours() {
    document.getElementById('cours-edit-id').value = '';
    document.getElementById('cours-slug').value = '';
    document.getElementById('cours-slug').disabled = false;
    document.getElementById('cours-titre-input').value = '';
    document.getElementById('cours-categorie').value = '';
    document.getElementById('cours-niveau').value = '0';
    document.getElementById('cours-ordre').value = '22';
    document.getElementById('cours-source').value = '';
    document.getElementById('form-cours-titre').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un cours';
    document.getElementById('cours-form-status').style.display = 'none';
}

async function sauvegarderCours() {
    const id = document.getElementById('cours-edit-id').value;
    const slug = document.getElementById('cours-slug').value.trim();
    const titre = document.getElementById('cours-titre-input').value.trim();
    const categorie = document.getElementById('cours-categorie').value;
    const niveau = parseInt(document.getElementById('cours-niveau').value) || 0;
    const ordre = parseInt(document.getElementById('cours-ordre').value) || 1;
    const sourcePath = document.getElementById('cours-source').value.trim() || null;
    const statusEl = document.getElementById('cours-form-status');

    if (!titre) { alert('Le titre est obligatoire.'); return; }
    if (!id && !slug) { alert('Le slug est obligatoire pour un nouveau cours.'); return; }

    try {
        if (id) {
            // MODIFICATION
            await apiFetch(`/modules/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ titre, categorie: categorie || null, niveau, ordre, sourcePath })
            });
            statusEl.textContent = '✅ Cours modifié avec succès.';
        } else {
            // CRÉATION
            await apiFetch('/modules', {
                method: 'POST',
                body: JSON.stringify({ slug, titre, categorie: categorie || null, niveau, ordre, sourcePath, actif: true })
            });
            statusEl.textContent = '✅ Cours créé avec succès.';
        }
        statusEl.style.display = 'block';
        statusEl.style.color = '#27ae60';
        annulerEditCours();
        await chargerTableauCours();
    } catch(e) {
        statusEl.textContent = '❌ Erreur : ' + e.message;
        statusEl.style.display = 'block';
        statusEl.style.color = '#e74c3c';
    }
}

async function toggleActifCours(id, nouvelEtat) {
    try {
        await apiFetch(`/modules/${id}`, { method: 'PATCH', body: JSON.stringify({ actif: nouvelEtat }) });
        await chargerTableauCours();
    } catch(e) { alert('Erreur : ' + e.message); }
}

async function supprimerCours(id, titre) {
    if (!confirm(`Supprimer définitivement le cours "${titre}" ?\nCette action est irréversible.`)) return;
    try {
        await apiFetch(`/modules/${id}`, { method: 'DELETE' });
        await chargerTableauCours();
    } catch(e) { alert('Erreur : ' + e.message); }
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
    const registerEleveZone = document.getElementById("register-eleve-zone");
    const registerFormateurZone = document.getElementById("register-formateur-zone");
    const authTitle = document.getElementById("auth-title");

    if (isChecked) {
        mdpInput.style.display = "block";
        loginNom.style.display = "block";
        loginNom.placeholder = currentAuthMode === 'register' ? "Votre prénom" : "Votre email formateur";
        if (loginIdZone) loginIdZone.style.display = "none";
        if (registerEleveZone) registerEleveZone.style.display = currentAuthMode === 'register' ? "none" : "block";
        if (registerFormateurZone) registerFormateurZone.style.display = currentAuthMode === 'register' ? "block" : "none";
        if (authTitle && currentAuthMode === 'register') authTitle.innerText = "Créer le compte formateur";
    } else {
        mdpInput.style.display = "none";
        loginNom.style.display = "block";
        loginNom.placeholder = "Votre prénom";
        if (loginIdZone) loginIdZone.style.display = currentAuthMode === 'login' ? "block" : "none";
        if (registerEleveZone) registerEleveZone.style.display = currentAuthMode === 'register' ? "block" : "none";
        if (registerFormateurZone) registerFormateurZone.style.display = "none";
        if (authTitle && currentAuthMode === 'register') authTitle.innerText = "Nouvelle Inscription";
    }
}

async function chargerGroupesAdmin() {
    const status = document.getElementById("admin-groupes-status");
    const tbody = document.getElementById("tbody-groupes-admin");
    if (!status || !tbody) return;

    if (!getAuthToken()) {
        status.innerText = "Mode local: connectez-vous en formateur API (email+mot de passe) pour gérer les groupes.";
        tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#777;'>Aucun accès API.</td></tr>";
        return;
    }

    try {
        const data = await apiFetch('/admin/groupes');
        const groupes = data.groupes || [];
        status.innerText = `✅ ${groupes.length} groupe(s) chargé(s).`;

        if (groupes.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#777;'>Aucun groupe.</td></tr>";
            return;
        }

        tbody.innerHTML = groupes.map((g) => `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;">
                    <strong>${escapeHtml(g.nom)}</strong><br>
                    <small>${escapeHtml(g.session || '-')}</small>
                </td>
                <td style="padding:8px; font-family:monospace;">
                    <span id="invite-${g.id}">${escapeHtml(g.inviteCode || '-')}</span>
                </td>
                <td style="padding:8px; white-space: nowrap;">
                    W <input id="w-${g.id}" type="number" min="0" max="10" value="${g.niveaux?.word ?? 0}" style="width:58px;"> 
                    E <input id="e-${g.id}" type="number" min="0" max="10" value="${g.niveaux?.excel ?? 0}" style="width:58px;"> 
                    P <input id="p-${g.id}" type="number" min="0" max="10" value="${g.niveaux?.powerpoint ?? 0}" style="width:58px;">
                </td>
                <td style="padding:8px;">${g.effectif ?? 0}</td>
                <td style="padding:8px; white-space: nowrap;">
                    <button class="btn-card" style="width:auto;margin:0 4px 0 0;padding:6px 10px;" onclick="appliquerNiveauxGroupe('${g.id}')">Niveaux</button>
                    <button class="btn-card" style="width:auto;margin:0;padding:6px 10px;background:#8e44ad;" onclick="regenererCodeGroupe('${g.id}')">Nouveau code</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        status.innerText = "❌ Erreur API groupes: " + e.message;
        tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#e74c3c;'>Impossible de charger les groupes.</td></tr>";
    }
}

function fmtPct(value) {
    const num = Number(value || 0);
    return `${Math.round(num)}%`;
}

function fmtScore(value) {
    const num = Number(value || 0);
    return num > 0 ? `${num.toFixed(1)} / 100` : '—';
}

async function chargerStatsAdmin() {
    const status = document.getElementById("admin-stats-status");
    const kpis = document.getElementById("admin-stats-kpis");
    const tbody = document.getElementById("tbody-stats-admin");
    if (!status || !kpis || !tbody) return;

    if (!getAuthToken()) {
        status.innerText = "Mode local: connectez-vous en formateur API pour voir les statistiques.";
        kpis.innerHTML = "";
        tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#777;'>Aucune donnée API.</td></tr>";
        return;
    }

    try {
        const data = await apiFetch('/admin/groupes/overview');
        const groupes = data.groupes || [];

        const totalGroupes = groupes.filter((g) => g.groupeId !== null).length;
        const totalEleves = groupes.reduce((sum, g) => sum + Number(g.effectif || 0), 0);
        const progressionMoy = groupes.length
            ? groupes.reduce((sum, g) => sum + Number(g.progressionMoyennePct || 0), 0) / groupes.length
            : 0;
        const completionMoy = groupes.length
            ? groupes.reduce((sum, g) => sum + Number(g.completionRate || 0), 0) / groupes.length
            : 0;

        status.innerText = `✅ Statistiques générées le ${new Date(data.generatedAt || Date.now()).toLocaleString()}`;
        kpis.innerHTML = `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;"><strong>Groupes</strong><br><span style="font-size:1.2rem;">${totalGroupes}</span></div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;"><strong>Élèves</strong><br><span style="font-size:1.2rem;">${totalEleves}</span></div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;"><strong>Progression</strong><br><span style="font-size:1.2rem;">${fmtPct(progressionMoy)}</span></div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;"><strong>Complétion</strong><br><span style="font-size:1.2rem;">${fmtPct(completionMoy)}</span></div>
        `;

        if (groupes.length === 0) {
            tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#777;'>Aucune statistique disponible.</td></tr>";
            return;
        }

        tbody.innerHTML = groupes.map((g) => `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px;"><strong>${escapeHtml(g.nom || 'Sans nom')}</strong><br><small>${escapeHtml(g.session || '-')}</small></td>
                <td style="padding:8px;">${Number(g.effectif || 0)}</td>
                <td style="padding:8px;">${fmtPct(g.progressionMoyennePct)}</td>
                <td style="padding:8px;">${fmtScore(g.scoreMoyen)}</td>
                <td style="padding:8px;">${fmtPct(g.completionRate)}</td>
            </tr>
        `).join('');
    } catch (e) {
        status.innerText = "❌ Erreur API statistiques: " + e.message;
        kpis.innerHTML = "";
        tbody.innerHTML = "<tr><td colspan='5' style='padding:10px;color:#e74c3c;'>Impossible de charger les statistiques.</td></tr>";
    }
}

async function creerGroupeDepuisUI() {
    if (!getAuthToken()) {
        alert("Connexion formateur API requise pour créer un groupe.");
        return;
    }

    const nom = (document.getElementById('groupe-nom')?.value || '').trim();
    const session = (document.getElementById('groupe-session')?.value || '').trim();
    const niveauWord = Number(document.getElementById('groupe-niveau-word')?.value || 0);
    const niveauExcel = Number(document.getElementById('groupe-niveau-excel')?.value || 0);
    const niveauPowerpoint = Number(document.getElementById('groupe-niveau-powerpoint')?.value || 0);

    if (!nom) {
        alert("Nom du groupe requis.");
        return;
    }

    try {
        const created = await apiFetch('/admin/groupes', {
            method: 'POST',
            body: JSON.stringify({
                nom,
                session: session || null,
                niveauWord,
                niveauExcel,
                niveauPowerpoint
            })
        });
        alert(`Groupe créé ✅\nCode invitation: ${created.inviteCode}`);
        document.getElementById('groupe-nom').value = '';
        await chargerGroupesAdmin();
    } catch (e) {
        alert("Création groupe impossible: " + e.message);
    }
}

async function appliquerNiveauxGroupe(groupId) {
    if (!getAuthToken()) return;
    const niveauWord = Number(document.getElementById(`w-${groupId}`)?.value || 0);
    const niveauExcel = Number(document.getElementById(`e-${groupId}`)?.value || 0);
    const niveauPowerpoint = Number(document.getElementById(`p-${groupId}`)?.value || 0);

    try {
        await apiFetch(`/admin/groupes/${groupId}/niveaux`, {
            method: 'PATCH',
            body: JSON.stringify({ niveauWord, niveauExcel, niveauPowerpoint })
        });
        alert("Niveaux mis à jour ✅");
        await chargerGroupesAdmin();
    } catch (e) {
        alert("Mise à jour impossible: " + e.message);
    }
}

async function regenererCodeGroupe(groupId) {
    if (!getAuthToken()) return;
    try {
        const data = await apiFetch(`/admin/groupes/${groupId}/regenerate-invite-code`, {
            method: 'POST'
        });
        const el = document.getElementById(`invite-${groupId}`);
        if (el) el.innerText = data.inviteCode;
        alert("Nouveau code: " + data.inviteCode);
    } catch (e) {
        alert("Regénération impossible: " + e.message);
    }
}

window.creerGroupeDepuisUI = creerGroupeDepuisUI;
window.appliquerNiveauxGroupe = appliquerNiveauxGroupe;
window.regenererCodeGroupe = regenererCodeGroupe;

// Fonction pour sauvegarder n'importe quelle donnée sur Firebase
async function sauvegarderDonnees(donnees) {
    const user = JSON.parse(localStorage.getItem('utilisateurActuel'));
    if (!user || user.isAdmin) return; // On ne sauvegarde pas si c'est Bernard ou si personne n'est connecté
    if (!window.db || !window.fbDoc || !window.fbUpdateDoc) return;

    try {
        const docRef = window.fbDoc(window.db, "eleves", user.nom);
        await window.fbUpdateDoc(docRef, donnees);
        console.log("☁️ Firebase mis à jour :", donnees);
    } catch (e) {
        console.error("Erreur de sauvegarde :", e);
    }
}

function ouvrirCours(nom) { window.location.href = nom + ".html"; }
function ouvrirCoursDepuisPath(sourcePath) {
    if (!sourcePath) return;
    window.location.href = sourcePath;
}
function ouvrirDashboard() {
    document.getElementById("admin-dashboard").style.display = "flex";
    générerTableauAdmin();
    chargerTableauCours();
    chargerGroupesAdmin();
    chargerStatsAdmin();
}
function fermerDashboard() { document.getElementById("admin-dashboard").style.display = "none"; }