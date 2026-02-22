// --- 1. NAVIGATION ---
function ouvrirCours(nom) { 
    window.location.href = nom + '.html'; 
}

// --- GESTION DU MODE SOMBRE ---
function toggleModeSombre() {
    const isSombre = document.body.classList.toggle('dark-mode');
    
    if (isSombre) {
        localStorage.setItem('theme', 'dark');
        const btn = document.getElementById('theme-icon');
        if(btn) btn.textContent = "☀️ Mode Clair";
    } else {
        localStorage.setItem('theme', 'light');
        const btn = document.getElementById('theme-icon');
        if(btn) btn.textContent = "🌙 Mode Sombre";
    }
}

function chargerTheme() {
    const themeSauvegardé = localStorage.getItem('theme');
    const boutonTheme = document.getElementById('theme-icon');

    if (themeSauvegardé === 'dark') {
        document.body.classList.add('dark-mode');
        if (boutonTheme) boutonTheme.textContent = "☀️ Mode Clair";
    }
}

// --- 2. GESTION DE LA PROGRESSION (BADGES, VERROUS, BARRE) ---
function mettreAJourTouteLaProgression() {
    const coursIds = ['pointeur', 'informatique', 'windows', 'bureau', 'clavier', 'word', 'excel', 'powerpoint'];
    let termine = 0;

    coursIds.forEach((idActuel, index) => {
        const badge = document.getElementById('badge-' + idActuel);
        const carte = document.getElementById('card-' + idActuel);
        const estFini = localStorage.getItem('cours-' + idActuel) === 'done';

        if (estFini) {
            termine++;
            if (badge) badge.style.display = 'inline-block';
        } else {
            if (badge) badge.style.display = 'none';
        }

        if (index > 0 && carte) {
            const idPrecedent = coursIds[index - 1];
            const estPrecedentFini = localStorage.getItem('cours-' + idPrecedent) === 'done';
            
            if (estPrecedentFini) {
                carte.classList.remove('card-locked');
            } else {
                carte.classList.add('card-locked');
            }
        }
    });

    const pourcentage = Math.round((termine / coursIds.length) * 100);
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    if (fill) fill.style.width = pourcentage + "%";
    if (text) text.textContent = pourcentage + "%";
}

// --- 3. VALIDATION D'UN COURS ---
function validerCours(nomDuCours) {
    localStorage.setItem('cours-' + nomDuCours, 'done');
    alert("Félicitations ! Vous avez validé cette étape.");
    window.location.href = "index.html"; 
}

// --- 4. SIMULATEUR WINDOWS (Fenetres) ---
function actionFenetre(type) {
    const fen = document.getElementById('fenetre-test');
    const consigne = document.getElementById('consigne-jeu');
    if (!fen) return;

    if (type === 'reduire') {
        fen.style.display = 'none';
        if (consigne) consigne.innerHTML = "Très bien ! Maintenant cliquez sur l'icône bleue en bas pour la rouvrir.";
    } else if (type === 'fermer') {
        fen.style.display = 'none';
        alert("Félicitations ! Vous savez manipuler les fenêtres.");
    }
}

// --- 5. LANCEMENT AUTOMATIQUE & FORMULAIRE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. On charge le thème
    chargerTheme();
    
    // 2. On met à jour les badges et verrous
    mettreAJourTouteLaProgression();

    // 3. Gestion du formulaire de contact (Le nouveau code est ici !)
    const formContact = document.getElementById('form-contact');
    if (formContact) {
        formContact.addEventListener('submit', function(e) {
            e.preventDefault();
            alert("Message envoyé ! (C'est une simulation, Bernard recevra votre message plus tard 😉)");
            this.reset(); // Vide le formulaire
        });
    }
});