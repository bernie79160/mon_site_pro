// --- Navigation ---
function ouvrirCours(nom) { window.location.href = nom + '.html'; }

// --- Gestion des Badges & Barre de progression ---
function mettreAJourProgression() {
    const coursIds = ['pointeur', 'informatique', 'windows', 'bureau', 'clavier', 'word', 'excel', 'powerpoint'];
    let termine = 0;

    coursIds.forEach(id => {
        const badge = document.getElementById('badge-' + id);
        if (localStorage.getItem('cours-' + id) === 'done') {
            termine++;
            if (badge) badge.style.display = 'inline-block';
        } else {
            if (badge) badge.style.display = 'none';
        }
    });

    const pourcentage = Math.round((termine / coursIds.length) * 100);
    if (document.getElementById('progress-fill')) document.getElementById('progress-fill').style.width = pourcentage + "%";
    if (document.getElementById('progress-text')) document.getElementById('progress-text').textContent = pourcentage + "%";
}
function verifierVerrous() {
    // 1. L'ordre de tes cours
    const ordreCours = ['pointeur', 'informatique', 'windows', 'bureau', 'word', 'excel', 'powerpoint'];

    for (let i = 1; i < ordreCours.length; i++) {
        const coursPrecedent = ordreCours[i - 1];
        const coursActuel = ordreCours[i];
        
        // On récupère la carte HTML correspondante
        // Note : il faudra ajouter des IDs sur tes cartes dans le HTML
        const carteElement = document.getElementById('card-' + coursActuel);
        
        if (carteElement) {
            // Si le cours précédent n'est pas terminé (pas de badge 'done')
            if (localStorage.getItem('cours-' + coursPrecedent) !== 'done') {
                carteElement.classList.add('card-locked');
            } else {
                carteElement.classList.remove('card-locked');
            }
        }
    }
}

// Appelle cette fonction au chargement de l'index
document.addEventListener('DOMContentLoaded', verifierVerrous);
// --- Validation des cours ---
function validerCours(nom) {
    localStorage.setItem('cours-' + nom, 'done');
    alert("Bravo ! Vous avez gagné un nouveau badge !");
    window.location.href = 'index.html';
}

// --- Simulateur Windows ---
function actionFenetre(type) {
    const fen = document.getElementById('fenetre-test');
    const consigne = document.getElementById('consigne-jeu');
    if (!fen) return;

    if (type === 'reduire') {
        fen.style.display = 'none';
        consigne.innerHTML = "Très bien ! Maintenant cliquez sur l'icône bleue en bas pour la rouvrir.";
    } else if (type === 'fermer') {
        fen.style.display = 'none';
        alert("Félicitations ! Vous savez manipuler les fenêtres.");
    }
}

window.onload = mettreAJourProgression;
function gererVerrouillage() {
    // Liste ordonnée des cours pour la progression
    const progression = [
        { actuel: 'informatique', precedent: 'pointeur' },
        { actuel: 'windows', precedent: 'informatique' },
        { actuel: 'bureau', precedent: 'windows' },
        { actuel: 'clavier', precedent: 'bureau' },   // <-- On ajoute cette étape ici
        { actuel: 'word', precedent: 'clavier' },     // <-- Word attend maintenant le clavier
        { actuel: 'excel', precedent: 'word' },
        { actuel: 'powerpoint', precedent: 'excel' }
    ];

    progression.forEach(etape => {
        const carte = document.getElementById('card-' + etape.actuel);
        if (carte) {
            // On vérifie si le cours PRECEDENT est marqué comme "done" dans le stockage
            const estPrecedentFini = localStorage.getItem('cours-' + etape.precedent) === 'done';

            if (estPrecedentFini) {
                carte.classList.remove('card-locked'); // On déverrouille
            } else {
                carte.classList.add('card-locked');    // On laisse verrouillé
            }
        }
    });
}

// Lancer la vérification dès que la page est prête
document.addEventListener('DOMContentLoaded', () => {
    gererVerrouillage();
    // On appelle aussi ta fonction de mise à jour de la barre si elle existe
    if (typeof mettreAJourProgression === 'function') {
        mettreAJourProgression();
    }
});