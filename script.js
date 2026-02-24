// ==========================================
// 1. GESTION DU THEME ET PROGRESSION
// ==========================================

const ordreCours = ['pointeur', 'informatique', 'windows', 'explorateur', 'bureau', 'clavier', 'word', 'excel', 'powerpoint', ];

window.addEventListener('DOMContentLoaded', () => {
    chargerTheme();
    mettreAJourProgression();
    appliquerVerrouillageVisuel();
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
        if (index === 0) return;
        const precedentFait = localStorage.getItem('cours-' + ordreCours[index - 1]) === 'done';
        const carte = document.querySelector(`.cours-card[onclick*="'${cours}'"]`);
        if (carte && !precedentFait && localStorage.getItem('cours-' + cours) !== 'done') {
            carte.classList.add('card-locked');
        }
    });
}

function ouvrirCours(nom) { 
    const index = ordreCours.indexOf(nom);
    if (index === 0 || localStorage.getItem('cours-' + ordreCours[index - 1]) === 'done') {
        window.location.href = nom + '.html';
    } else {
        alert("🔒 Doucement Bernard ! Terminez l'étape précédente.");
    }
}

function validerCours(nom) {
    localStorage.setItem('cours-' + nom, 'done');
    if (typeof confetti === 'function') confetti();
    setTimeout(() => {
        alert("Félicitations Bernard ! Étape validée.");
        window.location.href = "index.html";
    }, 500);
}

// ==========================================
// 2. LOGIQUE BUREAU (DRAG & DROP)
// ==========================================

function allowDrop(ev) {
    ev.preventDefault();
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
        document.getElementById('consigne-bureau').innerHTML = "🎉 Bravo ! Tout est rangé.";
        document.getElementById('consigne-bureau').style.color = "#27ae60";
    }
}

// ==========================================
// 3. LOGIQUE EXPLORATEUR (NOUVEAU DOSSIER)
// ==========================================

function creerDossier() {
    let nom = prompt("Entrez le nom du nouveau dossier :");
    if (nom === null || nom.trim() === "") return;

    const zone = document.getElementById('zone-fichiers');
    const div = document.createElement('div');
    div.className = 'folder-item new-folder-anim';
    div.innerHTML = `<i class="fas fa-folder"></i><span>${nom}</span>`;
    zone.appendChild(div);

    if (nom.toLowerCase().trim() === "mes courriers") {
        document.getElementById('consigne-explorateur').innerHTML = "🎉 Parfait ! Dossier créé.";
        document.getElementById('consigne-explorateur').style.color = "#27ae60";
        const btn = document.getElementById('btn-valider-explorateur');
        if(btn) btn.disabled = false;
        if (typeof confetti === 'function') confetti();
    }
}