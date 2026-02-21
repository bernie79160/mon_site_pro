// =========================================================
// 1. LES ACTIONS DE NAVIGATION (Outils globaux)
// =========================================================

function ouvrirCours(nomDuCours) {
    window.location.href = nomDuCours + '.html';
}

/**
 * Cette fonction est appelée quand on clique sur "Valider" dans un cours.
 * On lui donne le nom du cours (ex: 'windows') pour qu'elle le note comme fini.
 */
function validerCours(nomDuCours) {
    // 1. On enregistre dans la mémoire du navigateur
    localStorage.setItem('cours-' + nomDuCours, 'done');
    
    // 2. On affiche un message sympa
    alert("Bravo ! Vous avez obtenu le badge " + nomDuCours.toUpperCase() + " !");
    
    // 3. On repart à l'accueil pour voir la médaille
    window.location.href = 'index.html';
}

// =========================================================
// 2. LA LOGIQUE DE CALCUL (La "machinerie")
// =========================================================

function mettreAJourProgression() {
    const cours = ['windows', 'internet', 'word', 'excel', 'powerpoint'];
    let valides = 0;

    // Pour chaque cours, on vérifie s'il est terminé
    cours.forEach(c => {
        if (localStorage.getItem('cours-' + c) === 'done') {
            valides++;
            // On cherche le badge correspondant (ex: id="badge-windows")
            const badge = document.getElementById('badge-' + c);
            if (badge) {
                badge.style.display = 'block'; // On l'affiche !
            }
        }
    });

    // Calcul du pourcentage de la barre
    const pourcentage = (valides / cours.length) * 100;
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    if (fill && text) {
        fill.style.width = pourcentage + "%";
        text.textContent = Math.round(pourcentage) + "%";
    }

    // Alerte finale si 100%
    if (valides === cours.length && valides > 0) {
        setTimeout(() => {
            alert("🏆 INCROYABLE ! Vous avez terminé tous les modules !");
        }, 500);
    }
}

// =========================================================
// 3. LE DÉMARRAGE (Quand la page s'affiche)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Au démarrage, on calcule la barre et on affiche les badges
    mettreAJourProgression();

    // Bouton de félicitations (Accueil)
    const btnFelicitation = document.getElementById('btn-felicitation');
    if(btnFelicitation) {
        btnFelicitation.addEventListener('click', () => {
            alert("Félicitations ! Vous apprenez vite.");
        });
    }

    // Gestion du Mode Sombre
    const themeToggle = document.getElementById('theme-toggle');
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            themeToggle.textContent = document.body.classList.contains('dark-mode') ? "☀️ Mode Clair" : "🌙 Mode Sombre";
        });
    }
});