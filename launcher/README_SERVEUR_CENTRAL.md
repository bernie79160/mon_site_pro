# Serveur central — Guide opérationnel rapide

Ce dossier contient les scripts prêts à l'emploi pour le poste formateur (serveur central).

## Objectif

Un seul poste (formateur) lance:
- PostgreSQL (Docker)
- API backend (port 3001)
- Interface web (port 8080)

Les élèves ouvrent ensuite: `http://IP_DU_FORMATEUR:8080`.

## Linux

### Démarrer

```bash
./launcher/start_formateur.sh
```

### Vérifier l'état

```bash
./launcher/status_formateur.sh
```

### Arrêter

```bash
./launcher/stop_formateur.sh
```

### Raccourcis Bureau (double-clic)

```bash
./launcher/install_desktop_shortcut.sh
```

## Windows

### Démarrer

```bash
launcher\start_formateur_windows.bat
```

### Vérifier l'état

```bash
launcher\status_formateur_windows.bat
```

### Arrêter

```bash
launcher\stop_formateur_windows.bat
```

### Raccourcis Bureau

```bash
powershell -ExecutionPolicy Bypass -File launcher\install_windows_shortcuts.ps1
```

## macOS

### Démarrer

Double-clic sur:
- `launcher/start_formateur_macos.command`

ou terminal:

```bash
./launcher/start_formateur_macos.command
```

### Vérifier l'état

```bash
./launcher/status_formateur_macos.command
```

### Arrêter

```bash
./launcher/stop_formateur_macos.command
```

## Générer des packs prêts à envoyer (Linux/Windows/macOS)

```bash
./launcher/build_distribution_packages.sh
```

Sortie: `dist-launcher/`

## Publier une version (auto-update local)

Commande:

```bash
./launcher/publish_distribution_release.sh v1.0.0
```

Effets:
- génère les packs versionnés (`...-v1.0.0.*`)
- met à jour les alias `latest` par OS (`...-latest.*`)
- met à jour `dist-launcher/latest.json` (version + checksums)

## Nettoyage des anciennes versions

```bash
./launcher/cleanup_old_packages.sh 5
```

Garde les 5 dernières archives versionnées par OS.

## Dépannage express

- Docker ne démarre pas: ouvrir Docker Desktop puis relancer le script.
- Port 8080 occupé: arrêter l'ancien serveur ou utiliser `stop_formateur`.
- Port 3001 occupé: idem, puis relancer `start_formateur`.
- Pare-feu: autoriser 8080 et 3001 sur le poste formateur.
