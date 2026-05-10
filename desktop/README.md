# Desktop build (Electron)

Cette application permet de distribuer `mon_site_pro` sous forme installable.

## Prérequis

- Node.js 20+
- dépendances backend déjà installées (pour la partie API si utilisée en local)

## Installation des dépendances desktop

```bash
cd desktop
npm install
```

## Lancer en mode desktop (développement)

```bash
cd desktop
npm run dev
```

## Générer des installateurs

### Windows (NSIS .exe)

```bash
cd desktop
npm run dist:win
```

### macOS (DMG)

```bash
cd desktop
npm run dist:mac
```

### Linux (AppImage)

```bash
cd desktop
npm run dist:linux
```

### Tous les artefacts configurés

```bash
cd desktop
npm run dist
```

Les fichiers générés sont placés dans `desktop/dist/`.

## Note importante

Ce squelette ouvre l'interface locale (`index.html`) en application desktop.
La phase suivante peut intégrer un lancement automatique du backend en tâche de fond, selon le mode de déploiement retenu (poste formateur unique ou installation sur chaque poste).
