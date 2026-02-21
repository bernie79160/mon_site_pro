// =========================================================
// 1. LES ACTIONS DE NAVIGATION (Outils globaux)
// =========================================================

function ouvrirCours(nomDuCours) {
    window.location.href = nomDuCours + '.html';
}

function validerCours(nomDuCours) {
    localStorage.setItem('cours-' + nomDuCours, 'done');
    alert("Bravo ! Vous avez obtenu le badge " + nomDuCours.toUpperCase() + " !");
    window.location.href = 'index.html';
}

// =========================================================
// 2. LA LOGIQUE DE CALCUL (La "machinerie")
// =========================================================

function mettreAJourProgression() {
    const cours = ['informatique', 'internet', 'word', 'excel', 'powerpoint'];
    let valides = 0;

    cours.forEach(c => {
        const badge = document.getElementById('badge-' + c);
        if (localStorage.getItem('cours-' + c) === 'done') {
            valides++;
            if (badge) badge.style.display = 'block';
        } else {
            if (badge) badge.style.display = 'none'; 
        }
    });

    const pourcentage = (valides / cours.length) * 100;
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    if (fill && text) {
        fill.style.width = pourcentage + "%";
        text.textContent = Math.round(pourcentage) + "%";
    }

    if (valides === cours.length && valides > 0) {
        setTimeout(() => {
            alert("🏆 INCROYABLE ! Vous avez terminé tous les modules !");
        }, 500);
    }
}

// =========================================================
// 3. LE DÉMARRAGE ET INTERACTIONS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    
    mettreAJourProgression();

    const ecran = document.getElementById('ecran-test');
    const message = document.getElementById('message-souris');
    const visuelGauche = document.getElementById('clic-gauche');
    const visuelDroit = document.getElementById('clic-droit');

    if (ecran) {
        let score = 0;
        const typesDeClics = ["CLIC GAUCHE", "CLIC DROIT", "DOUBLE CLIC GAUCHE"];
        let objectifActuel = "";
        let clickTimer = null; // Pour distinguer clic simple et double

        function genererNouvelObjectif() {
            objectifActuel = typesDeClics[Math.floor(Math.random() * typesDeClics.length)];
            message.innerHTML = `Action demandée : <br><span style="font-size: 2rem; color: #f1c40f;">${objectifActuel}</span>`;
        }

        function verifierAction(typeRealise) {
            if (objectifActuel === "FINI") return;

            if (typeRealise === objectifActuel) {
                score++;
                document.getElementById('score-valeur').textContent = score;
                message.innerHTML = "✅ Bien joué !";
                
                if (score >= 20) {
                    message.innerHTML = "🏆 Défi réussi ! <br> Vous maîtrisez les clics de souris.";
                    objectifActuel = "FINI";
                } else {
                    setTimeout(genererNouvelObjectif, 1000);
                }
            } else {
                message.innerHTML = "❌ Essayez encore !";
                setTimeout(() => {
                    if(objectifActuel !== "FINI") {
                        message.innerHTML = `Action demandée : <br><span style="font-size: 2rem; color: #f1c40f;">${objectifActuel}</span>`;
                    }
                }, 800);
            }
        }

        // --- GESTION DES CLICS ---

        ecran.addEventListener('click', (e) => {
            if (objectifActuel === "FINI") return;
            
            // Animation visuelle bouton gauche
            visuelGauche.style.backgroundColor = "#3498db";
            setTimeout(() => visuelGauche.style.backgroundColor = "white", 200);

            if (e.detail === 1) {
                // On attend 250ms pour être sûr que ce n'est pas un début de double-clic
                clickTimer = setTimeout(() => {
                    verifierAction("CLIC GAUCHE");
                }, 250);
            } else if (e.detail === 2) {
                clearTimeout(clickTimer); // Annule l'action "GAUCHE" prévue
                verifierAction("DOUBLE CLIC GAUCHE");
            }
        });

        ecran.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Bloque le menu contextuel du navigateur
            if (objectifActuel === "FINI") return;

            // Animation visuelle bouton droit
            visuelDroit.style.backgroundColor = "#e74c3c";
            setTimeout(() => visuelDroit.style.backgroundColor = "white", 200);
            
            verifierAction("CLIC DROIT");
        });

        genererNouvelObjectif();
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