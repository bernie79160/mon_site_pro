# Guide Installateur (Windows / macOS / Linux)

Objectif: distribuer une application installable (double-clic), sans donner accès au code source aux formateurs/élèves.

## 1) Réponse courte

Oui, c'est possible et c'est la bonne direction.

Pour ce projet, l'approche recommandée est:
- créer une application desktop (shell) avec `Electron`
- embarquer le frontend + backend dans l'application
- générer des installateurs par OS via GitHub Actions
- publier seulement les artefacts installables (`.exe`, `.dmg`, `.AppImage`/`.deb`)

## 2) Ce que cela change pour l'utilisateur final

L'utilisateur:
- télécharge un installateur selon son OS
- installe l'application
- lance l'app par icône (double-clic)
- laisse l'application démarrer automatiquement le serveur central
- crée son premier compte formateur depuis l'interface si nécessaire
- se connecte ensuite en formateur dans l'interface

Il n'a pas besoin de Node.js, Docker, ni accès au code.

## 3) Formats d'installateurs conseillés

- Windows: `NSIS` (`.exe`)
- macOS: `DMG` (`.dmg`)
- Linux: `AppImage` (portable)

## 4) Pipeline GitHub recommandé

1. Tag version (`v1.0.0`)
2. GitHub Actions build sur:
   - `windows-latest`
   - `macos-latest`
   - `ubuntu-latest`
3. Création des installateurs
4. Publication automatique sur GitHub Releases

Si vous n'avez pas encore les droits admin GitHub, vous pouvez faire les builds en local immédiatement (section 9).

## 5) Confidentialité du code

Pour éviter l'accès au code:
- ne distribuer que les binaires/installateurs
- garder le dépôt privé (ou publier seulement un dépôt binaire)
- ne pas fournir l'archive source aux utilisateurs finaux

Note: techniquement, une app JS packagée peut toujours être inspectée par un utilisateur avancé. Pour un usage formation, le niveau de protection est généralement suffisant.

## 6) Mode de fonctionnement recommandé en salle

Deux options:

### Option A (recommandée pour 15 postes): serveur formateur + clients navigateur
- un poste formateur lance backend + front
- les élèves se connectent via `http://IP_FORMATEUR:8080`
- maintenance simplifiée (une seule machine à maintenir)

### Option B: app desktop installée sur chaque poste
- chaque poste a son installateur
- utile hors réseau ou en autonomie
- plus de maintenance (mises à jour sur chaque poste)

## 7) Étapes de mise en place (prochaine itération)

1. Créer un dossier `desktop/` (Electron)
2. Lancer backend localement depuis l'app (port interne)
3. Ouvrir une fenêtre desktop sur le frontend
4. Ajouter scripts build (`electron-builder`)
5. Ajouter workflow GitHub Actions
6. Tester installation Windows/macOS/Linux

## 8) Décision pratique

Si ton objectif est “formateur se connecte et c'est tout”, on peut livrer:
- d'abord **Windows** (priorité)
- puis macOS
- puis Linux

Cela permet une première distribution rapide et propre.

## 9) Build local immédiat (sans GitHub admin)

Depuis `site-pro-bernard-office/desktop`:

```bash
npm install
```

Windows:

```bash
npm run dist:win
```

macOS:

```bash
npm run dist:mac
```

Linux:

```bash
npm run dist:linux
```

Les installateurs sont produits dans `desktop/dist/` et peuvent être envoyés directement aux utilisateurs finaux.

## 10) Workflow GitHub déjà prêt

Le dépôt contient un workflow prêt à l'emploi:
- `.github/workflows/desktop-build.yml`

Il construit automatiquement:
- Linux: AppImage
- Windows: NSIS (`.exe`)
- macOS: DMG (`.dmg`)

Dès que les droits GitHub nécessaires sont disponibles, vous pourrez le lancer via **Actions > Desktop Build** ou via un tag `v*`.

## 11) Installation automatique Windows (sans assistant)

L'installateur NSIS est configuré en mode *one-click*.

Pour un déploiement silencieux (script, GPO, outil MDM), utilisez:

```powershell
MonSitePro-Setup-0.1.0.exe /S
```

Note importante:
- si le binaire n'est pas signé, SmartScreen peut encore bloquer l'exécution initiale;
- pour éviter ce blocage en production, signer l'installateur avec un certificat Authenticode (idéalement EV).

## 12) Créer un compte formateur sur un PC qui a téléchargé l'application

Mode recommandé désormais:

1. installer l'application desktop
2. ouvrir l'application
3. vérifier que **Docker Desktop** est démarré
4. attendre le démarrage automatique du serveur central
5. dans l'accueil, cliquer sur **Inscription**
6. cocher **Je suis le formateur**
7. créer le premier compte formateur directement depuis l'interface

Ce mode évite au formateur d'ouvrir un terminal ou de manipuler le dossier `backend`.

### Mode avancé / maintenance

Pour un compte formateur persistant via terminal, vous pouvez encore utiliser le pack **serveur central** (`dist-launcher`) ou le dépôt complet.

Étapes Windows:

1. Télécharger et décompresser `mon-site-pro-serveur-central-windows-<version>.tar.gz`.
2. Lancer:

```bash
launcher\start_formateur_windows.bat
```

3. Ouvrir un terminal dans le dossier `backend` du pack.
4. Créer le compte formateur:

```bash
npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"
```

5. Se connecter sur l'accueil avec **Je suis le formateur** + email + mot de passe.

Remarque:
- l'application desktop seule (`.exe`) sert d'interface utilisateur;
- le compte formateur backend nécessite le service API démarré côté formateur.
