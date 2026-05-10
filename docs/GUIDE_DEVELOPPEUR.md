# Guide Développeur — mon_site_pro

## 1) Stack technique

- Frontend statique: `index.html`, pages cours, `script.js`, `style.css`
- Backend: Node.js + Fastify
- ORM: Prisma
- DB: PostgreSQL
- Auth: JWT

## 2) Arborescence utile

- `backend/src/routes`: endpoints API
- `backend/prisma/schema.prisma`: schéma source
- `backend/prisma/migrations`: migrations
- `backend/scripts`: scripts utilitaires/seed
- `docs/GUIDE_FORMATEUR.md`: mode opératoire terrain

## 3) Setup local

### Backend

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

### Frontend

```bash
cd ..
python3 -m http.server 8080
```

## 4) Setup intranet

### Backend LAN

Dans `.env` :

```env
HOST=0.0.0.0
PORT=3001
```

Lancer :

```bash
cd backend
npm run dev
```

### Frontend LAN

```bash
cd ..
python3 -m http.server 8080 --bind 0.0.0.0
```

### URL élèves

- `http://IP_SERVEUR:8080`

Le frontend pointe automatiquement vers :
- `http://<hostname>:3001`

Override manuel possible en console navigateur :

```javascript
setApiBaseUrl("http://192.168.1.50:3001")
resetApiBaseUrl()
```

## 5) Flux métiers clés

### 5.1 Groupes et invitations

- `Groupe.inviteCode` unique
- Inscription élève possible via `inviteCode`
- Niveaux par groupe: `niveauWord`, `niveauExcel`, `niveauPowerpoint`

### 5.2 Filtrage modules

- `GET /modules`
- Pour un élève: filtrage en fonction des niveaux du groupe
- Pour un formateur/admin: accès à tous les modules actifs

### 5.3 Compte élève

- `PATCH /me`: update profil/mot de passe
- `DELETE /me`: archivage (soft delete)
- Blocage des logins des comptes archivés

## 6) Scripts utiles

```bash
npm run seed:modules
npm run seed:questions
npm run backfill:eleve-codes
npm run formateur:create-account -- --prenom "Bernard" --nom "Tellier" --email "bernard@example.com" --password "motdepasse123"
npm run formateur:create-group -- --nom "Session" --session "Mai 2026" --word 1 --excel 0 --powerpoint 0
```

## 7) Endpoints principaux

### Auth

- `POST /auth/register-eleve`
- `POST /auth/login-eleve`
- `POST /auth/register`
- `POST /auth/login`

### Élève

- `GET /me`
- `PATCH /me`
- `DELETE /me`
- `GET /modules`
- `GET /progressions/me`
- `PUT /progressions/me/:moduleId`

### Admin/Formateur

- `GET /admin/groupes`
- `POST /admin/groupes`
- `PATCH /admin/groupes/:id/niveaux`
- `POST /admin/groupes/:id/regenerate-invite-code`
- `GET /admin/groupes/overview`

## 8) Ajouter des contenus 2025

### Dépôt des fichiers

Copier le dossier dans le workspace, par exemple:

```bash
cp -r "/source/LIVRETS_WORD_VERSION_2025" "/home/seb/Téléchargements/01_LIVRETS_WORD_VERSION_2019/"
```

### Process recommandé

1. Cartographier les nouveaux supports (Word/Excel/PowerPoint)
2. Associer chaque support à un niveau (`0..3`)
3. Créer/mettre à jour les modules (`slug`, `categorie`, `niveau`)
4. Mettre à jour les pages HTML correspondantes
5. Ajouter/adapter les quiz de fin de module

## 9) Qualité / tests

- Vérifier erreurs éditeur: `get_errors`
- Smoke test API via `app.inject`
- Vérifier compatibilité UI existante (ne pas casser le mode débutant)

## 10) Dépannage rapide

- Erreur Prisma migration: vérifier DB active + `.env`
- 401 API: vérifier token JWT présent
- Modules manquants élève: vérifier niveaux du groupe
- LAN KO: vérifier IP serveur + ports `8080` / `3001`

