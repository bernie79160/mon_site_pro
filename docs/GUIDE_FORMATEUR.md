# Guide Formateur — Utilisation de l'application

Ce guide est pensé pour un usage en salle (intranet) avec plusieurs postes élèves.

## 1) Ce que fait le formateur

1. Créer un **groupe** de formation
2. Récupérer le **code d'invitation** du groupe
3. Donner ce code aux élèves
4. Les élèves s'inscrivent avec leur prénom + code
5. Les cours visibles sont filtrés selon les niveaux autorisés

---

## 2) Préparer une session (avant l'arrivée des élèves)

### 2.A Démarrage en un clic (recommandé)

#### Option la plus simple — Application desktop installée

Sur Windows, après installation de l'application desktop:

1. ouvrir **Mon Site Pro**
2. attendre le message de démarrage automatique
3. l'application lance elle-même le **serveur central**
4. l'accueil s'ouvre ensuite automatiquement

Prérequis important:
- **Docker Desktop** doit être installé et démarré sur le poste formateur.

Dans ce mode, l'application:
- démarre PostgreSQL (Docker)
- démarre l'API backend
- démarre l'interface web locale sur `:8080`
- ouvre l'accueil dans la fenêtre desktop

Les élèves peuvent ensuite se connecter sur l'adresse du poste formateur (`http://IP_FORMATEUR:8080`).

#### Option technique — Lancement manuel depuis le projet

Sur le poste formateur, utilisez le launcher central:

```bash
cd /home/seb/Téléchargements/01_LIVRETS_WORD_VERSION_2019/site-pro-bernard-office
./launcher/start_formateur.sh
```

Ce script:
- vérifie Docker
- démarre PostgreSQL (container)
- lance l'API backend (`:3001`)
- lance l'interface web (`:8080`)
- ouvre automatiquement l'application dans le navigateur

Pour créer les raccourcis double-clic sur le Bureau:

```bash
cd /home/seb/Téléchargements/01_LIVRETS_WORD_VERSION_2019/site-pro-bernard-office
./launcher/install_desktop_shortcut.sh
```

Un raccourci d'arrêt est aussi créé:

```bash
cd /home/seb/Téléchargements/01_LIVRETS_WORD_VERSION_2019/site-pro-bernard-office
./launcher/stop_formateur.sh
```

Vérifier rapidement l'état des services:

```bash
./launcher/status_formateur.sh
```

#### Windows

Dans le dossier du projet:

```bash
launcher\start_formateur_windows.bat
```

Arrêt:

```bash
launcher\stop_formateur_windows.bat
```

Statut:

```bash
launcher\status_formateur_windows.bat
```

Créer raccourcis Bureau:

```bash
powershell -ExecutionPolicy Bypass -File launcher\install_windows_shortcuts.ps1
```

#### macOS

Double-clic:
- `launcher/start_formateur_macos.command`
- `launcher/stop_formateur_macos.command`

Si macOS bloque au premier lancement (Gatekeeper):
- clic droit > Ouvrir > Ouvrir

Ou via terminal:

```bash
./launcher/start_formateur_macos.command
./launcher/stop_formateur_macos.command
./launcher/status_formateur_macos.command
```

#### Générer des packs prêts à envoyer (Linux/Windows/macOS)

```bash
./launcher/build_distribution_packages.sh
```

Résultat dans `dist-launcher/`.

### 2.0 Créer un compte formateur (si vous n'en avez pas)

Important:
- le serveur central doit être démarré;
- avec la nouvelle application desktop, ce démarrage est automatique au lancement si Docker est disponible.

#### Cas recommandé — Depuis l'application installée

Au premier lancement sur le poste formateur:

1. ouvrir l'application
2. cliquer sur **Inscription**
3. cocher **Je suis le formateur**
4. renseigner:
	- prénom
	- nom
	- email formateur
	- mot de passe
5. valider

Résultat attendu:
- le premier compte formateur du poste est créé automatiquement;
- vous êtes connecté immédiatement;
- vous pouvez ouvrir le **Dashboard** et créer votre groupe.

Important:
- cette création simplifiée est réservée au **premier compte formateur**;
- si un compte formateur existe déjà, utilisez l'écran **Connexion**.

#### Cas avancé A — Vous avez le projet complet

Depuis `site-pro-bernard-office/backend`:

```bash
npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"
```

#### Cas avancé B — Vous avez téléchargé un pack formateur (sans dépôt Git)

1. Décompressez `mon-site-pro-serveur-central-windows-*.tar.gz`.
2. Démarrez les services:

```bash
launcher\start_formateur_windows.bat
```

3. Ouvrez un terminal dans le dossier `backend` du pack décompressé.
4. Créez le compte:

```bash
npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"
```

5. Connectez-vous sur l'accueil:
   - cocher **Je suis le formateur**
   - saisir l'**email** + mot de passe

Note (mode secours local):
- si l'API n'est pas disponible, le mot de passe `1234` active un mode formateur local temporaire (sans persistance backend complète).

Recommandations mot de passe (important sous Linux/bash):
- éviter `!` dans le mot de passe tapé en terminal (bash peut l'interpréter)
- préférer une forme comme `Formation-2026@Secure`

Résultat attendu:
- `✅ Compte formateur créé` (première fois)
- ou `✅ Compte existant promu/mis à jour en FORMATEUR` (si l'email existe déjà)

Ensuite, dans la page d'accueil:
- cocher **Je suis le formateur**
- saisir l'**email formateur**
- saisir le mot de passe

Ce script sert aussi pour les essais: si l'email existe déjà, le compte est mis à jour et promu en `FORMATEUR`.

### 2.1 Démarrer le backend

Depuis `site-pro-bernard-office/backend` :

```bash
npm run dev
```

### 2.2 Démarrer l'interface web

Depuis `site-pro-bernard-office` :

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

### 2.3 Trouver l'adresse IP du poste formateur

```bash
hostname -I
```

Exemple d'IP : `192.168.1.50`

Les élèves ouvriront ensuite :
- `http://192.168.1.50:8080`

---

## 3) Créer un groupe et obtenir le code invitation

### Option 1 (nouveau, recommandé): Dashboard formateur (UI)

1. Sur la page d'accueil, cochez **Je suis le formateur**
2. Entrez votre **email formateur** + mot de passe
3. Cliquez sur **Dashboard**
4. Dans **Gestion des groupes (API)**:
	- saisir nom/session/niveaux
	- cliquer **Créer groupe**
5. Le code invitation s'affiche immédiatement dans le tableau

Actions disponibles dans le tableau:
- bouton **Niveaux**: met à jour Word/Excel/PowerPoint
- bouton **Nouveau code**: régénère le code d'invitation

### Option 2: script utilitaire (terminal)

Depuis `site-pro-bernard-office/backend` :

```bash
npm run formateur:create-group -- --nom "Session Bureautique" --session "Mai 2026" --word 1 --excel 0 --powerpoint 0
```

Résultat affiché :
- ID du groupe
- Code d'invitation (ex: `GRP-AB12CD`)
- Niveaux choisis

### Signification des niveaux

- `--word`: niveau autorisé Word
- `--excel`: niveau autorisé Excel
- `--powerpoint`: niveau autorisé PowerPoint

Exemple :
- Word `1`, Excel `0`, PowerPoint `0`
- Les élèves verront les modules correspondant à ces niveaux max.

Word niveaux actuellement en place:
- `word-n1` → page `word_n1.html`
- `word-n2` → page `word_n2.html`
- `word-n3` → page `word_n3.html`

Sur l'accueil, une section **Parcours Word par niveaux** s'affiche automatiquement après connexion API.

---

## 4) Que dire aux élèves (consigne prête à l'emploi)

> « Ouvrez l'adresse `http://192.168.1.50:8080`, cliquez sur Inscription, entrez votre prénom, puis le code groupe `GRP-XXXXXX`. Notez votre identifiant élève affiché. »

Ensuite, pour se reconnecter :
- prénom
- ID élève (`ABC-1234`)

---

## 5) Déroulé type avec 15 postes

1. Le formateur allume son poste serveur
2. Lance backend + interface (sections 2.1 et 2.2)
3. Crée un groupe (section 3)
4. Écrit le code groupe au tableau
5. Les 15 postes ouvrent `http://IP_FORMATEUR:8080`
6. Les élèves s'inscrivent
7. Le formateur peut faire évoluer les niveaux plus tard

---

## 6) Modifier les niveaux pendant la formation

Actuellement, modification via API (ou script futur UI).

Exemple API (nécessite token formateur) :
- `PATCH /admin/groupes/:id/niveaux`

Si vous souhaitez, on peut ajouter un bouton UI formateur dédié dans le dashboard pour éviter la partie technique.

---

## 7) Dépannage rapide

### Les élèves n'accèdent pas au site

- Si vous utilisez le mode un clic, relancer `./launcher/start_formateur.sh`
- Vérifier que `python3 -m http.server 8080 --bind 0.0.0.0` tourne
- Vérifier pare-feu local (ports 8080 et 3001)
- Vérifier que tous les postes sont sur le même réseau

### Inscription refusée avec code groupe

- Vérifier que le code n'a pas été régénéré
- Regénérer un nouveau code si besoin

### Les modules ne s'affichent pas comme prévu

- Vérifier les niveaux du groupe (Word/Excel/PowerPoint)
- Vérifier la catégorie + niveau des modules

### Connexion formateur impossible (`Unknown argument visitCount`)

Si vous voyez une erreur Prisma mentionnant `Unknown argument visitCount`, régénérez le client Prisma:

```bash
cd "/home/seb/Téléchargements/01_LIVRETS_WORD_VERSION_2019/site-pro-bernard-office/backend"
npx prisma generate
npm run dev
```

Puis retentez la connexion formateur.

---

## 8) Bonnes pratiques terrain

- Créer **1 groupe par session** (date/groupe clair)
- Conserver la liste des codes distribués
- Faire noter l'ID élève immédiatement
- Prévoir un poste “support” pour réinscription rapide

---

## 9) Ce qui est déjà en place

- Inscription élève avec code groupe
- ID élève automatique
- Compteur de visites
- Aide élève intégrée dans l'accueil
- Filtrage des modules par niveaux
- Archivage compte élève

