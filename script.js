// ==========================================
// 1. FONCTIONS GLOBALES
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    chargerTheme();
    if (document.getElementById('progress-fill')) {
        mettreAJourProgression();
        appliquerVerrouillageVisuel();
    }
});

function toggleModeSombre() {
    const isSombre = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isSombre ? 'dark' : 'light');
    const btn = document.getElementById('theme-icon');
    if(btn) btn.textContent = isSombre ? "☀️ Mode Clair" : "🌙 Mode Sombre";
}

function chargerTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('theme-icon');
        if (btn) btn.textContent = "☀️ Mode Clair";
    }
}

const ordreCours = ['pointeur', 'informatique', 'windows', 'bureau', 'clavier', 'word', 'excel', 'powerpoint', 'explorateur'];

function ouvrirCours(nom) { 
    const index = ordreCours.indexOf(nom);
    if (index === 0 || localStorage.getItem('cours-' + ordreCours[index - 1]) === 'done') {
        window.location.href = nom + '.html';
    } else {
        alert("🔒 Doucement Bernard ! Terminez l'étape précédente.");
    }
}

function appliquerVerrouillageVisuel() {
    ordreCours.forEach((cours, index) => {
        if (index === 0) return;
        const estFait = localStorage.getItem('cours-' + cours) === 'done';
        const precedentFait = localStorage.getItem('cours-' + ordreCours[index - 1]) === 'done';
        const carte = document.querySelector(`.cours-card[onclick*="'${cours}'"]`);
        if (carte && !precedentFait && !estFait) {
            carte.classList.add('card-locked');
        }
    });
}

// --- LA PARTIE QUI ÉTAIT COUPÉE ---
function validerCours(nom) {
    localStorage.setItem('cours-' + nom, 'done');
    if (typeof confetti === 'function') confetti();
    setTimeout(() => {
        alert("Félicitations Bernard ! Étape validée.");
        window.location.href = "index.html";
    }, 500);
}

window.addEventListener('DOMContentLoaded', () => {
    chargerTheme();
    mettreAJourProgression();
    appliquerVerrouillageVisuel();
});

// ... garde tes fonctions toggleModeSombre et chargerTheme ...

function mettreAJourProgression() {
    const ordre = ['pointeur', 'informatique', 'windows', 'bureau', 'clavier', 'word', 'excel', 'powerpoint', 'explorateur'];
    let terminés = 0;

    ordre.forEach(cours => {
        if (localStorage.getItem('cours-' + cours) === 'done') {
            terminés++;
            const badge = document.getElementById('badge-' + cours);
            if (badge) badge.style.display = 'block';
        }
    });

    const pourcent = Math.round((terminés / ordre.length) * 100);
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-text');
    if (fill) fill.style.width = pourcent + '%';
    if (txt) txt.innerText = pourcent + '%';
}

// Assure-toi que la fonction ouvrirCours est bien là
function ouvrirCours(nom) {
    window.location.href = nom + '.html';
}
// ==========================================
// LOGIQUE SPÉCIFIQUE AU BUREAU (DRAG & DROP)
// ==========================================

function allowDrop(ev) {
    ev.preventDefault(); // Autorise le dépôt
    if (ev.target.classList.contains('cible-depot')) {
        ev.target.style.transform = "scale(1.1)";
        if (ev.target.id === 'corbeille') ev.target.classList.add('survol-corbeille');
        if (ev.target.id === 'dossier-rangement') ev.target.classList.add('survol-rangement');
    }
}

function leaveDrop(ev) {
    ev.target.style.transform = "scale(1)";
    ev.target.classList.remove('survol-corbeille', 'survol-rangement');
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function dropCorbeille(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const element = document.getElementById(data);
    
    // Si c'est un fichier gris (file1, file2, file3)
    if (data.includes('file')) {
        element.style.display = "none";
        verifierFinBureau();
    } else {
        alert("Attention ! Ne jetez pas votre CV !");
    }
    leaveDrop(ev);
}

function dropRangement(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const element = document.getElementById(data);
    
    // Si c'est le CV (mon-cv)
    if (data === 'mon-cv') {
        element.style.display = "none";
        verifierFinBureau();
    } else {
        alert("Ce fichier n'a rien à faire dans vos documents, jetez-le à la corbeille.");
    }
    leaveDrop(ev);
}

function verifierFinBureau() {
    const fichiersRestants = Array.from(document.querySelectorAll('.icone-bureau'))
                                  .filter(el => el.style.display !== 'none');
    
    if (fichiersRestants.length === 0) {
        const btn = document.getElementById('btn-valider-bureau');
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        document.getElementById('consigne-bureau').innerHTML = "🎉 Bravo ! Tout est rangé.";
        document.getElementById('consigne-bureau').style.color = "#27ae60";
    }
}