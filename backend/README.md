# Backend `mon_site_pro`

API Fastify + Prisma + PostgreSQL pour transformer le site statique en plateforme.

## Pré-requis
- Node.js 20+
- Docker (recommandé pour PostgreSQL)

## Démarrage rapide
1. Copier la config:
```bash
cp .env.example .env
```

2. Lancer PostgreSQL:
```bash
docker compose up -d
```

3. Installer les dépendances:
```bash
npm install
```

4. Générer Prisma + créer la base:
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed:modules
npm run backfill:eleve-codes
```

5. Démarrer l'API:
```bash
npm run dev
```

API disponible sur `http://localhost:3001`.

## Utilisation en intranet (LAN)
- Lancer l'API avec `HOST=0.0.0.0` (déjà prévu dans `.env.example`).
- Depuis un autre poste du réseau, utiliser `http://IP_DU_SERVEUR:3001`.
- Le frontend calcule automatiquement l'API via `http://<hostname>:3001`.
- Option avancée: vous pouvez forcer l'URL API dans le navigateur:
  - `setApiBaseUrl("http://192.168.1.50:3001")`
  - `resetApiBaseUrl()` pour revenir au mode auto.

## Endpoints MVP
- `GET /health`
- `POST /auth/register-eleve` (compatibilité UI actuelle : prénom → `eleveCode`, `inviteCode` optionnel)
- `POST /auth/login-eleve` (compatibilité UI actuelle : prénom + ID)
- `POST /auth/register` (`inviteCode` optionnel)
- `POST /auth/login`
- `GET /me` (JWT requis)
- `PATCH /me` (mise à jour prénom/nom/mot de passe)
- `DELETE /me` (archivage compte)
- `GET /modules` (JWT requis)
- `POST /modules` (rôle `FORMATEUR` ou `ADMIN`)
- `GET /progressions/me` (JWT requis)
- `PUT /progressions/me/:moduleId` (JWT requis)
- `GET /admin/groupes` (rôle `FORMATEUR` ou `ADMIN`)
- `POST /admin/groupes` (création groupe + `inviteCode`)
- `PATCH /admin/groupes/:id/niveaux` (niveaux Word/Excel/PowerPoint)
- `POST /admin/groupes/:id/regenerate-invite-code`
- `GET /admin/groupes/overview` (rôle `FORMATEUR` ou `ADMIN`)

## Pilotage par niveaux (Word/Excel/PowerPoint)
- Chaque groupe possède `niveauWord`, `niveauExcel`, `niveauPowerpoint`.
- `GET /modules` filtre automatiquement le catalogue pour les élèves selon le niveau de leur groupe.
- Les formateurs/admin voient l'ensemble des modules actifs.

## Inscription par code d'invitation
- Le formateur crée un groupe et récupère `inviteCode` (ex: `GRP-AB12CD`).
- L'élève peut s'inscrire avec ce code via `POST /auth/register-eleve` ou `POST /auth/register`.
- L'élève est automatiquement rattaché au groupe, avec les niveaux autorisés.

## Exemple de payload register
```json
{
  "prenom": "Bernard",
  "nom": "Tellier",
  "email": "bernard@example.com",
  "password": "motdepassefort"
}
```

La réponse `register` / `login` contient aussi `user.eleveCode` au format `ABC-1234`.

## Prochaine étape recommandée
Brancher `index.html` / `script.js` sur l'API (`/auth`, `/progressions`, `/modules`) en gardant la vue actuelle intacte.
