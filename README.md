# mon_site_pro

Plateforme d'apprentissage bureautique (frontend statique + backend API Fastify/Prisma/PostgreSQL).

## Démarrage rapide

### Option recommandée (serveur central en un clic)

```bash
./launcher/start_formateur.sh
```

Le script vérifie Docker, démarre PostgreSQL + API + interface web puis ouvre automatiquement l'application.

Pour l'arrêt:

```bash
./launcher/stop_formateur.sh
```

Pour installer les raccourcis Bureau (double-clic):

```bash
./launcher/install_desktop_shortcut.sh
```

Vérifier l'état des services:

```bash
./launcher/status_formateur.sh
```

### Windows (serveur central en un clic)

Depuis l'invite de commandes dans le projet:

```bash
launcher\start_formateur_windows.bat
```

Arrêt:

```bash
launcher\stop_formateur_windows.bat
```

Raccourcis Bureau:

```bash
powershell -ExecutionPolicy Bypass -File launcher\install_windows_shortcuts.ps1
```

Statut:

```bash
launcher\status_formateur_windows.bat
```

### macOS (serveur central en un clic)

Double-cliquer:
- `launcher/start_formateur_macos.command`
- `launcher/stop_formateur_macos.command`

Ou en terminal:

```bash
./launcher/start_formateur_macos.command
./launcher/stop_formateur_macos.command
./launcher/status_formateur_macos.command
```

Créer des packs de distribution (Linux/Windows/macOS):

```bash
./launcher/build_distribution_packages.sh
```

Publier une release locale versionnée (met à jour les alias `latest` + manifeste):

```bash
./launcher/publish_distribution_release.sh v1.0.0
```

Nettoyer les anciennes archives (garde 5 versions par OS):

```bash
./launcher/cleanup_old_packages.sh 5
```

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run prisma:migrate
npm run seed:modules
npm run seed:questions
npm run dev
```

### 2) Frontend

```bash
cd ..
python3 -m http.server 8080 --bind 0.0.0.0
```

Puis ouvrir:
- Local: `http://localhost:8080`
- Intranet: `http://IP_DU_POSTE_FORMATEUR:8080`

## Documentation

- Guide formateur complet: [`docs/GUIDE_FORMATEUR.md`](docs/GUIDE_FORMATEUR.md)
- Guide développeur complet: [`docs/GUIDE_DEVELOPPEUR.md`](docs/GUIDE_DEVELOPPEUR.md)
- Guide installateur (desktop): [`docs/GUIDE_INSTALLATEUR.md`](docs/GUIDE_INSTALLATEUR.md)
- Guide opérationnel serveur central: [`launcher/README_SERVEUR_CENTRAL.md`](launcher/README_SERVEUR_CENTRAL.md)
- Référence backend/API: [`backend/README.md`](backend/README.md)

## Cas d'usage formateur (code invitation)

Créer un compte formateur (première fois):

```bash
cd backend
npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"
```

Notes importantes:
- sous Linux/bash, éviter `!` dans le mot de passe saisi en terminal
- le script peut aussi mettre à jour/promouvoir un compte existant en `FORMATEUR`

Créer un groupe et obtenir le code élève:

```bash
cd backend
npm run formateur:create-group -- --nom "Session Bureautique" --session "Mai 2026" --word 1 --excel 0 --powerpoint 0
```

Le script retourne immédiatement:
- l'ID groupe
- le `inviteCode` à donner aux élèves

## Dépannage rapide (connexion formateur)

Si la connexion échoue avec une erreur Prisma du type `Unknown argument visitCount`, régénérer le client Prisma:

```bash
cd backend
npx prisma generate
npm run dev
```

## Commandes utiles

```bash
# depuis backend
npm run dev
npm run prisma:migrate
npm run seed:modules
npm run seed:questions
npm run backfill:eleve-codes
npm run formateur:create-group -- --nom "Session" --word 1 --excel 0 --powerpoint 0
```

## Version installable (sans accès admin GitHub)

Vous pouvez déjà générer des installateurs en local, sans GitHub Actions:

```bash
cd desktop
npm install
npm run dist:win
```

Autres OS:

```bash
cd desktop
npm run dist:mac
npm run dist:linux
```

Les artefacts sont générés dans `desktop/dist/`.
Quand vous aurez les droits admin GitHub, on branchera ces mêmes builds dans un workflow CI pour publier automatiquement sur Releases.

## Niveaux Word (N1 → N3)

Le parcours Word niveaux est maintenant implémenté:
- `word-n1` (`word_n1.html`)
- `word-n2` (`word_n2.html`)
- `word-n3` (`word_n3.html`)

Les modules sont gérés en base avec `categorie=word` et `niveau=1..3`, puis affichés dynamiquement dans la section **Parcours Word par niveaux** de l'accueil selon les niveaux autorisés du groupe.