// ==========================================
// 1. SYSTÈME DE PROGRESSION ET THÈME
// ==========================================

const ordreCours = ['pointeur', 'informatique', 'windows', 'explorateur', 'bureau', 'clavier', 'word', 'excel', 'powerpoint'];

window.addEventListener('DOMContentLoaded', () => {
    chargerTheme();
    mettreAJourProgression();
    if (document.querySelector('.cours-card')) {
        appliquerVerrouillageVisuel();
    }
});

function chargerTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-icon');
        if (btn) btn.textContent = "☀️ Mode Clair";
    }
}

function toggleModeSombre() {
    const isSombre = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isSombre ? 'dark' : 'light');
    const btn = document.getElementById('theme-icon');
    if (btn) btn.textContent = isSombre ? "☀️ Mode Clair" : "🌙 Mode Sombre";
}

function mettreAJourProgression() {
    let terminés = 0;
    ordreCours.forEach(cours => {
        if (localStorage.getItem('cours-' + cours) === 'done') {
            terminés++;
            const badge = document.getElementById('badge-' + cours);
            if (badge) badge.style.display = 'block';
        }
    });

    const pourcent = Math.round((terminés / ordreCours.length) * 100);
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-text');
    
    if (fill) fill.style.width = pourcent + '%';
    if (txt) txt.innerText = pourcent + '%';
}

function appliquerVerrouillageVisuel() {
    ordreCours.forEach((cours, index) => {
        if (index === 0) return; // Le premier cours est toujours libre

        const precedentFait = localStorage.getItem('cours-' + ordreCours[index - 1]) === 'done';
        const carte = document.getElementById('card-' + cours);
        
        if (carte && !precedentFait && localStorage.getItem('cours-' + cours) !== 'done') {
            carte.classList.add('card-locked');
            carte.title = "Terminez le cours précédent pour débloquer celui-ci";
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
    afficherModaleValidation(
        "Validation",
        "Bravo ! Souhaitez-vous valider ce cours et retourner à l'accueil ?",
        () => {
            localStorage.setItem('cours-' + cours, 'done');
            window.location.href = 'index.html';
        }
    );
}

// --- Fonction spécifique pour l'explorateur ---
function validerCoursExplorateur() {
    afficherModaleValidation(
        "Félicitations !",
        "Mission accomplie. Voulez-vous valider cet exercice et retourner à l'accueil ?",
        () => {
            localStorage.setItem('cours-explorateur', 'done');
            window.location.href = 'index.html';
        }
    );
}

// --- REMPLACE LES ALERT() PAR UNE MODALE PROPRE ---
function afficherMessage(titre, message) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    
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
    document.getElementById('btnCloseMsg').onclick = () => overlay.remove();
}

// --- Fonction interne pour créer la modale de validation ---
function afficherModaleValidation(titre, message, callbackYes) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    
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

    document.getElementById('btnYes').onclick = () => {
        overlay.remove();
        callbackYes();
    };

    document.getElementById('btnNo').onclick = () => {
        overlay.remove();
    };
}

// ==========================================
// 3. LOGIQUE DE L'EXPLORATEUR ET DU BUREAU
// ==========================================
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev, typeCible) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const elementGlisse = document.getElementById(data);
    
    if (elementGlisse && elementGlisse.getAttribute('data-type') === typeCible) {
        elementGlisse.style.display = "none";
        if (typeof verifierFinBureau === 'function') verifierFinBureau();
    } else {
        // Utilisation de notre nouvelle fonction au lieu de alert()
        afficherMessage("Oups !", "Ce n'est pas le bon dossier !");
    }
}