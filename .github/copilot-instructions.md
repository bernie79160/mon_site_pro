# Copilot Instructions — mon_site_pro

## Produit & public cible
Plateforme d'apprentissage bureautique en français pour **débutants complets** (seniors, adultes en reconversion). L'interface actuelle est un excellent premier jet : **ne pas casser la vue** pendant la migration.
- Déploiement actuel : GitHub Pages (`main`).
- Objectif : évoluer vers une vraie plateforme (BDD + comptes + évaluations + RGPD) compatible **intranet** et **internet**.

## Architecture actuelle (vérifiée)
- Site statique sans build : `index.html`, pages `{cours}.html`, `script.js`, `style.css` (749 lignes, sections numérotées).
- `index.html` : grille de cartes, barre de progression, login/modal, dashboard formateur.
- `script.js` : auth, progression, verrouillage, chrono, thème, CRUD Firebase.
- `style.css` : styles globaux + dark mode ; styles spécifiques parfois inline dans les pages cours.
- `idee.txt` : notes client/roadmap pédagogiques.

## Progression des cours (source de vérité actuelle)
`ordreCours` dans `script.js` : `pointeur, barredefil, informatique, windows, explorateur, bureau, clavier, internet, mail, word, excel, powerpoint`.
- Validation : `validerCours('{cours}')`.
- Stockage local : `localStorage` (`cours-{name}=done`, `utilisateurActuel`, `theme`).
- Ajout d'un cours : mettre à jour `ordreCours`, créer `{cours}.html`, ajouter la carte `id="card-{cours}"` et badge `id="badge-{cours}"` dans `index.html`.

## Conventions UI/pédagogie à respecter
- Langage simple, lisible, encourageant ; gros textes ; couleurs douces ; faible charge cognitive.
- Exercices interactifs progressifs (drag-and-drop/simulations) adaptés aux personnes peu à l'aise.
- Icônes Font Awesome + polices Montserrat/Open Sans via CDN.
- Dark mode obligatoire sur tout nouveau composant (`body.dark-mode`).
- Contrainte actuelle assumée : `user-select: none` global.

## Écart actuel vs cible (important)
- Existant : usage de `alert()`/`confirm()` dans `script.js`.
- Cible : migrer vers modales custom unifiées (`afficherMessage`, `afficherModaleValidation`) pour une UX homogène et accessible.
- Existant : auth formateur côté client (`"1234"`).
- Cible : auth serveur + rôles + journalisation.

## Plan de migration par phases (MVP → V1)
### Phase 0 — Cadrage (1 semaine)
- Stack validée : `Node.js + Fastify + PostgreSQL + Prisma` (migration progressive en gardant l'UI actuelle).
- Cartographie des contenus depuis `TX*/WINDOWS 101` et `idee.txt`.
- Spécification RGPD (base légale, conservation, droits, traces d'audit).

### MVP (4–6 semaines)
- Backend API + BDD (élèves, groupes, modules, tests, tentatives, scores).
- Auth serveur (élève/formateur/admin), suppression des secrets côté client.
- Test de fin de partie (QCM + correction formateur pour cas pratiques).
- Vue formateur minimale : progression par candidat + vue groupe basique.
- Vue élève minimale : progression + scores + compte modifiable.

### V1 (6–10 semaines)
- Entraînement type TOSA (sessions chronométrées, score final, historique, feedback).
- Module dactylographie (WPM, précision, courbe de progression).
- Reporting avancé formateur (cohortes, alertes, exports).
- Déploiement dual intranet/internet avec même modèle de données.

## Schéma de données initial (proposé)
Collections/tables minimales :
- `eleves` : `id`, `prenom`, `nom`, `email?`, `groupeId`, `role`, `statut`, `createdAt`, `consentements`, `archivedAt?`.
- `groupes` : `id`, `nom`, `formateurId`, `session`, `actif`, `createdAt`.
- `modules` : `id`, `slug`, `titre`, `ordre`, `categorie`, `sourcePath`, `actif`.
- `tests` : `id`, `moduleId`, `type` (`qcm|pratique|tosa`), `niveau`, `dureeSec`, `bareme`, `actif`.
- `questions` : `id`, `testId`, `ordre`, `intitule`, `options[]`, `bonneReponse`, `points`, `competence`.
- `tentatives` : `id`, `eleveId`, `testId`, `startedAt`, `submittedAt`, `score`, `maxScore`, `statut`, `corrigePar`, `commentaire`.
- `progressions` : `id`, `eleveId`, `moduleId`, `etat` (`locked|in_progress|done`), `tempsSec`, `lastActivityAt`.
- `typing_sessions` : `id`, `eleveId`, `langue`, `dureeSec`, `wpm`, `accuracy`, `errors`, `createdAt`.

## RGPD (règles produit à implémenter)
- Droit d'accès/rectification/export/suppression via parcours UI dédié.
- Conserver les noms candidats post-formation selon une politique documentée (durée + motif + responsable).
- Séparer données d'identité et données pédagogiques pour minimisation.

## Sources de contenu pour les cours
Références obligatoires (hors `site-pro-bernard-office/`) : `TX 101a`, `TX 101c`, `TX 108`, `TX109`, `TX110`, `TX 203`, `WINDOWS 101`.

## Backlog persistant (mise à jour continue)
Ajouter toute nouvelle idée client ici avec date/priorité, puis la rattacher à `Phase 0`, `MVP` ou `V1`.
- [P0] Inscription + identifiant élève + compteur de visites.
- [P0] Tests de fin de partie + correction formateur.
- [P0] Auth serveur + rôles + sécurité.

### Statut P0 (mai 2026)
- ✅ Inscription + identifiant élève (`eleveCode`) + compteur de visites (`visitCount`).
- ✅ Tests de fin de partie QCM + historique tentatives (correction formateur pratique à poursuivre).
- ✅ Auth serveur + rôles + sécurité de base (archivage compte, blocage login comptes archivés).

## Décisions validées (2026-05-05)
- Le parcours actuel correspond au `Niveau 0`.
- Word/Excel/PowerPoint doivent être déclinés en niveaux progressifs (`N1`, `N2`, `N3`).
- Le pilotage des niveaux est prioritairement géré par le formateur via le groupe (et non par élève unitaire).
- Le mécanisme recommandé d'affectation est un code d'invitation de groupe.
- Le TOSA est préparé côté backend mais ne doit pas être affiché dans l'interface élève pour l'instant.
- Les élèves doivent pouvoir modifier leur compte et l'archiver depuis leur espace.
- Une aide élève doit être disponible depuis l'accueil (FAQ simple + guidance prochain cours).
- L'application doit rester exploitable en intranet (API LAN + configuration simple poste formateur).
- [P1] Simulateur TOSA + scoring final.
- [P1] Vue groupe et analytics formateur.
- [P1] Dactylographie vitesse/précision.

## Plan MVP exécutable en 10 tickets (ordre recommandé)
Format ticket : `Objectif` / `Dépend de` / `Done quand`.

1. **T01 — Initialiser backend API + BDD**
	- Objectif : créer service backend (Node.js recommandé) + connexion BDD + healthcheck.
	- Dépend de : aucun.
	- Done quand : API répond sur `/health`, environnement dev documenté, secrets hors frontend.

2. **T02 — Implémenter schéma de données initial**
	- Objectif : créer modèles/collections `eleves`, `groupes`, `modules`, `tests`, `questions`, `tentatives`, `progressions`, `typing_sessions`.
	- Dépend de : T01.
	- Done quand : migrations/seed OK, index minimum posés (`eleveId`, `moduleId`, `testId`, `groupeId`).

3. **T03 — Importer le référentiel de modules**
	- Objectif : transformer les dossiers `TX*`/`WINDOWS 101` en modules structurés (slug, ordre, titre, sourcePath).
	- Dépend de : T02.
	- Done quand : la liste modules BDD couvre le parcours actuel et correspond à `ordreCours`.

4. **T04 — Auth serveur + rôles**
	- Objectif : remplacer auth client par auth backend (`eleve`, `formateur`, `admin`) + sessions/JWT.
	- Dépend de : T01, T02.
	- Done quand : plus de mot de passe sensible en frontend, routes protégées par rôle.

5. **T05 — Inscription élève + identifiant + consentements RGPD**
	- Objectif : créer onboarding élève avec génération d'identifiant, consentement et traçabilité minimale.
	- Dépend de : T02, T04.
	- Done quand : un élève peut s'inscrire, modifier son compte, et ses consentements sont historisés.

6. **T06 — API progression & synchronisation frontend**
	- Objectif : passer de `localStorage` seul à une progression persistée serveur (avec fallback local temporaire).
	- Dépend de : T02, T04.
	- Done quand : progression consultable depuis plusieurs appareils pour un même élève.

7. **T07 — Tests de fin de partie (QCM + pratique)**
	- Objectif : activer un test à la fin de chaque partie/module avec barème et tentative.
	- Dépend de : T02, T06.
	- Done quand : chaque module a au moins 1 test associé et un score final enregistré.

8. **T08 — Interface correction formateur**
	- Objectif : permettre au formateur de corriger les exercices pratiques, noter et commenter.
	- Dépend de : T04, T07.
	- Done quand : correction modifie `tentatives.score`, `corrigePar`, `commentaire`.

9. **T09 — Vue formateur candidat + groupe**
	- Objectif : dashboard avec détail candidat (progression/tests) + vue groupe (moyenne, retard, taux de complétion).
	- Dépend de : T06, T07, T08.
	- Done quand : filtres par groupe/session + export CSV basique.

10. **T10 — Simulateur TOSA MVP**
	 - Objectif : session chronométrée multi-questions avec score final et historique par élève.
	 - Dépend de : T07.
	 - Done quand : élève lance un test type TOSA, voit score final et progression historique.

### Critères de sortie MVP (go/no-go)
- Auth serveur opérationnelle et rôles respectés.
- Progression + résultats stockés en BDD (plus seulement localStorage).
- Tests de fin de partie actifs sur les modules principaux.
- Formateur dispose d'une vue candidat + groupe exploitable.
- Aucune régression visuelle majeure sur `index.html` et pages cours existantes.
