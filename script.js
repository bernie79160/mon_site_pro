// ==========================================
// 1. FONCTIONS GLOBALES (Navigation et Thème)
// ==========================================

function ouvrirCours(nom) { 
    window.location.href = nom + '.html'; 
}

function toggleModeSombre() {
    const isSombre = document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-icon');
    
    if (isSombre) {
        localStorage.setItem('theme', 'dark');
        if(btn) btn.textContent = "☀️ Mode Clair";
    } else {
        localStorage.setItem('theme', 'light');
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

function validerCours(nomDuCours) {
    localStorage.setItem('cours-' + nomDuCours, 'done');
    alert("Félicitations ! Vous avez validé cette étape.");
    window.location.href = "index.html"; 
}

// ==========================================
// 2. LOGIQUE DU BUREAU (GLISSER-DÉPOSER)
// ==========================================

// Initialisation des compteurs
if (typeof window.fichiersSupprimes === 'undefined') window.fichiersSupprimes = 0;
if (typeof window.cvRange === 'undefined') window.cvRange = false;

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function allowDrop(ev) {
    ev.preventDefault();
    const cible = ev.currentTarget;
    if (cible.id === 'corbeille') {
        cible.classList.add('survol-corbeille');
    } else if (cible.id === 'dossier-rangement') {
        cible.classList.add('survol-rangement');
    }
}

function leaveDrop(ev) {
    ev.currentTarget.classList.remove('survol-corbeille', 'survol-rangement');
}

function dropCorbeille(ev) {
    ev.preventDefault();
    leaveDrop(ev);
    let id = ev.dataTransfer.getData("text");
    let el = document.getElementById(id);
    
    if (id && id.includes("file")) {
        if(el) el.style.display = 'none';
        window.fichiersSupprimes++;
        verifierEtatBureau();
    } else if (id === "mon-cv") {
        alert("⚠️ Attention Bernard ! Ne jetez pas votre CV, glissez-le vers le dossier 'MES DOCUMENTS'.");
    }
}

function dropRangement(ev) {
    ev.preventDefault();
    leaveDrop(ev);
    let id = ev.dataTransfer.getData("text");
    let el = document.getElementById(id);
    
    if (id === "mon-cv") {
        if(el) el.style.display = 'none';
        window.cvRange = true;
        const dossier = document.getElementById('dossier-rangement');
        if(dossier) dossier.innerHTML = '<i class="fas fa-folder-open" style="font-size: 50px; color: #2ecc71; margin-bottom: 10px;"></i><span>CV RANGÉ !</span>';
        verifierEtatBureau();
    } else {
        alert("Ce fichier est inutile, mettez-le plutôt à la corbeille.");
    }
}

function verifierEtatBureau() {
    const totalASupprimer = 3;
    const consigne = document.getElementById('consigne-bureau');
    const btnValider = document.getElementById('btn-valider-bureau');

    if (window.fichiersSupprimes >= totalASupprimer && window.cvRange) {
        // 1. On change la consigne
        if(consigne) {
            consigne.innerHTML = "✅ Bravo Bernard ! Le bureau est nickel.";
            consigne.style.color = "#27ae60";
        }

        // 2. On transforme ou on affiche le bouton pour aller à la suite
        if(btnValider) {
            btnValider.disabled = false;
            btnValider.style.opacity = "1";
            btnValider.style.backgroundColor = "#27ae60";
            btnValider.innerHTML = "Étape Suivante : Créer un dossier <i class='fas fa-arrow-right'></i>";
            
            // On change l'action du bouton : au lieu de valider et quitter, 
            // il valide en arrière-plan et envoie vers l'explorateur
            btnValider.onclick = function() {
                localStorage.setItem('cours-bureau', 'done');
                window.location.href = "explorateur.html";
            };
        }

        if (typeof confetti === 'function') confetti();
    }
}
// ==========================================
// 3. LOGIQUE DE L'EXPLORATEUR (CRÉATION ET SOUS-DOSSIER)
// ==========================================

let etapeExplorateur = 1; // 1: Créer "Mes courriers", 2: Attendre clic, 3: Créer "Année 2024"

function creerDossier() {
    const zone = document.getElementById('zone-fichiers');
    const btn = document.getElementById('btn-nouveau-dossier');
    
    if (document.getElementById('nouveau-dossier-temp')) return;
    if (etapeExplorateur === 2) {
        alert("Cliquez d'abord sur le dossier 'Mes courriers' pour entrer dedans !");
        return;
    }

    const dossierHTML = `
        <div id="nouveau-dossier-temp" style="text-align:center; width: 120px; animation: apparition 0.3s ease;">
            <i class="fas fa-folder" style="font-size: 60px; color: #f1c40f; display: block; margin-bottom: 5px;"></i>
            <input type="text" id="nom-dossier-input" placeholder="Nommez-moi..." 
                style="width: 100%; text-align: center; border: 2px solid #3498db; border-radius: 4px; padding: 2px;">
            <small style="font-size: 10px; color: #666;">Appuyez sur Entrée</small>
        </div>
    `;

    zone.insertAdjacentHTML('beforeend', dossierHTML);
    const input = document.getElementById('nom-dossier-input');
    input.focus();

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            verifierNom(input.value.trim().toLowerCase());
        }
    });
}

function verifierNom(nomSaisi) {
    const zone = document.getElementById('zone-fichiers');
    const consigne = document.getElementById('consigne-explorateur');

    if (etapeExplorateur === 1 && nomSaisi === "mes courriers") {
        // RÉUSSITE ÉTAPE 1
        zone.innerHTML = `
            <div id="dossier-parent" onclick="entrerDansDossier()" style="text-align:center; width: 120px; cursor: pointer; transition: transform 0.2s;">
                <i class="fas fa-folder" style="font-size: 60px; color: #f1c40f; display: block; margin-bottom: 5px;"></i>
                <span style="font-weight: bold; color: #2c3e50;">Mes courriers</span>
                <br><small style="color: #27ae60; font-weight: bold;">(Cliquez pour ouvrir)</small>
            </div>
        `;
        consigne.innerHTML = "✅ Très bien ! Maintenant, <strong>cliquez sur le dossier</strong> pour l'ouvrir.";
        etapeExplorateur = 2;

    } else if (etapeExplorateur === 3 && nomSaisi === "année 2024") {
        // RÉUSSITE ÉTAPE 2 (Sous-dossier)
        zone.innerHTML = `
            <div style="text-align:center; width: 120px;">
                <i class="fas fa-folder" style="font-size: 60px; color: #f1c40f; display: block; margin-bottom: 5px;"></i>
                <span style="font-weight: bold; color: #2c3e50;">Année 2024</span>
            </div>
        `;
        consigne.innerHTML = "✅ Excellent Bernard ! Vous maîtrisez l'arborescence.";
        if (typeof confetti === 'function') confetti();
        
        setTimeout(() => {
            validerCours('explorateur');
        }, 2000);

    } else {
        // ERREUR
        const cible = (etapeExplorateur === 1) ? "Mes courriers" : "Année 2024";
        alert("Presque ! Il faut écrire exactement : " + cible);
        document.getElementById('nom-dossier-input').select();
    }
}

function entrerDansDossier() {
    if (etapeExplorateur !== 2) return;
    
    const zone = document.getElementById('zone-fichiers');
    const chemin = document.getElementById('chemin-actuel');
    const consigne = document.getElementById('consigne-explorateur');

    zone.style.opacity = "0"; // Petit effet de transition
    setTimeout(() => {
        zone.innerHTML = ""; 
        zone.style.opacity = "1";
        chemin.innerHTML = " > Mes courriers";
        consigne.innerHTML = "Vous êtes dans le dossier. Créez un sous-dossier nommé : <strong>Année 2024</strong>";
        etapeExplorateur = 3;
    }, 200);
}
function mettreAJourProgression() {
    const listeCours = ['pointeur', 'informatique', 'windows', 'bureau', 'clavier', 'word', 'excel', 'powerpoint', 'explorateur'];
    let terminés = 0;

    listeCours.forEach(cours => {
        if (localStorage.getItem('cours-' + cours) === 'done') {
            terminés++;
            // Affiche le badge "Terminé" si la carte existe
            const badge = document.getElementById('badge-' + cours);
            if (badge) badge.style.display = 'block';
        }
    });

    const pourcentage = Math.round((terminés / listeCours.length) * 100);
    document.getElementById('progress-fill').style.width = pourcentage + '%';
    document.getElementById('progress-text').innerText = pourcentage + '%';
}