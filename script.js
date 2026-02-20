document.addEventListener('DOMContentLoaded', () => {
    
    // --- GESTION DU BOUTON FÉLICITATION ---
    // On utilise getElementById pour être précis
    const btnFelicitation = document.getElementById('btn-felicitation');

    if(btnFelicitation) { // On vérifie qu'il existe bien
        btnFelicitation.addEventListener('click', () => {
            alert("Félicitations ! Tu viens d'exécuter ton premier script JS.");
            btnFelicitation.textContent = "Merci d'avoir cliqué !";
            btnFelicitation.style.backgroundColor = "#27ae60";
        });
    }

    // --- GESTION DU MODE SOMBRE ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                themeToggle.textContent = "☀️ Mode Clair";
            } else {
                themeToggle.textContent = "🌙 Mode Sombre";
            }
        });
    }
});