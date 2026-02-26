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
            carte.style.opacity = "0.5";
            carte.style.pointerEvents = "none";
            // On ajoute une petite icône de cadenas si on veut
            carte.title = "Terminez le cours précédent pour débloquer celui-ci";
        }
    });
}

function ouvrirCours(nom) {
    window.location.href = nom + ".html";
}

function validerCours(nom) {
    localStorage.setItem('cours-' + nom, 'done');
    alert("Félicitations Bernard ! Étape validée.");
    window.location.href = "index.html";
}

// ==========================================
// 2. LOGIQUE DE L'EXPLORATEUR ET DU BUREAU
// ==========================================
// (Tes fonctions drop, drag, toggleMenuNouveau restent identiques ici)
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }
function drop(ev, typeCible) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const elementGlisse = document.getElementById(data);
    if (elementGlisse.getAttribute('data-type') === typeCible) {
        elementGlisse.style.display = "none";
        verifierFinBureau();
    } else {
        alert("Ce n'est pas le bon dossier !");
    }
}