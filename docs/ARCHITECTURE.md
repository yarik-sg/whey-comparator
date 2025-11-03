# Architecture Fitidion

Cette fiche décrit la structure technique actuelle de Fitidion, les flux de données principaux et les points de vigilance identifiés pour la reprise du développement.

## 1. Vue d'ensemble

```
[Frontend Next.js 15] ──HTTP──> [/api/proxy] ──> [FastAPI agrégation (main.py)] ──> [Scrapers / SerpAPI / Fallback]
                               └──> [FastAPI apps/api (catalogue CRUD)] ──> [PostgreSQL + Redis + Celery]
```

- **Frontend (Next.js 15 / React 19)** : App Router, composants shadcn/ui personnalisés, TanStack Query vendored pour React 19.【F:frontend/package.json†L11-L20】【F:frontend/src/app/catalogue/page.tsx†L232-L512】
- **Service d'agrégation (`main.py`)** : FastAPI mono-fichier qui combine résultats SerpAPI, scrapers internes et catalogue de secours.【F:main.py†L26-L117】【F:main.py†L2506-L3130】
- **API métier (`apps/api`)** : FastAPI modulaire avec SQLAlchemy, Alembic, Celery et Redis pour la gestion du catalogue, des offres et des alertes.【F:apps/api/app/main.py†L1-L70】【F:apps/api/app/routers/products.py†L105-L479】
- **Services auxiliaires** : `services/gyms_scraper.py` pour Basic-Fit, `services/scraper/` pour la collecte prix, `fallback_catalogue.py` pour assurer la disponibilité des données.【F:services/gyms_scraper.py†L1-L27】【F:fallback_catalogue.py†L1-L160】

## 2. Frontend Next.js

- **Organisation** :
  - `src/app/` regroupe les pages App Router (`/catalogue`, `/products/[id]`, `/comparateur`, `/gyms`, etc.) et les routes API `app/api` (proxy, alerts, image-proxy).【F:frontend/src/app/comparison/page.tsx†L1-L324】【F:frontend/src/app/api/proxy/route.ts†L1-L43】
  - `src/pages/api/` contient encore d'anciennes routes (Pages Router). Ces handlers devront être migrés ou supprimés pour éviter les collisions (`/api/comparatif`, `/api/gyms`).【F:frontend/src/pages/api/comparatif.ts†L1-L200】
  - `src/lib/apiClient.ts` centralise la résolution des URL backend (support `NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`, `INTERNAL_PROXY_BASE_URL`).【F:frontend/src/lib/apiClient.ts†L80-L140】
  - `src/lib/images.ts` gère le proxy d'images (forçage HTTPS) en détectant l'environnement (Next, Vite).【F:frontend/src/lib/images.ts†L12-L128】

- **Design system** : Tailwind CSS 4 (`@import "tailwindcss"`), thème Fitidion via CSS custom properties (`globals.css`, `fitidion-theme.css`), composants shadcn adaptés (`components/ui`).【F:frontend/src/app/globals.css†L1-L64】【F:frontend/src/components/ui/button.tsx†L1-L90】

- **Data fetching** :
  - Les pages utilisent TanStack Query vendored (`frontend/vendor`) et des loaders côté serveur (RSC) pour précharger le catalogue (`fetchSerpDealsWithFallback`).【F:frontend/src/app/catalogue/page.tsx†L232-L512】
  - Le proxy `app/api/proxy` redirige vers l'API d'agrégation en passant `target` (`products`, `compare`, `gyms`, `search`).【F:frontend/src/app/api/proxy/route.ts†L1-L43】
  - Les appels critiques (ex : `/catalogue`) basculent sur un fallback local en cas d'échec du proxy pour préserver l'UX.【F:frontend/src/app/catalogue/page.tsx†L329-L512】

## 3. Service d'agrégation (`main.py`)

- **Responsabilités** :
  - Exposer des endpoints publics stateless (`/products`, `/compare`, `/search`, `/programmes`, `/gyms`, `/api/gyms`).【F:main.py†L193-L3137】
  - Combiner les résultats du scraper externe (`SCRAPER_BASE_URL`) avec les données fallback lorsque le service n'est pas joignable.【F:main.py†L1035-L1179】
  - Normaliser les offres (score protéine/prix, détection du meilleur marchand) et enrichir les réponses avec historique de prix.【F:main.py†L2574-L2754】【F:main.py†L3012-L3130】
  - Fournir un alias `/api/gyms` pour le frontend (évite la duplication côté Next).【F:main.py†L2081-L2109】

- **Intégrations externes** :
  - SerpAPI via `SERPAPI_KEY` (recherche fallback si le scraper est indisponible).【F:main.py†L26-L117】
  - Scraper Basic-Fit (`services/gyms_scraper.get_basicfit_gyms`). En cas d'échec, une liste statique `GYM_DIRECTORY` est renvoyée.【F:main.py†L59-L191】

- **Configuration** : CORS permissif en développement (`allow_origins=['*']`). Prévoir un durcissement pour la production.【F:main.py†L17-L25】

## 4. API métier (`apps/api`)

- **Structure** :
  - `app/main.py` instancie FastAPI, monte les routeurs (`products`, `offers`, `suppliers`, `price_alerts`).【F:apps/api/app/main.py†L1-L70】
  - `config.py` lit les variables `API_*` (Pydantic Settings) afin de partager la configuration entre API et workers.【F:apps/api/app/config.py†L1-L65】
  - `database.py` gère la Session SQLAlchemy (context manager + dépendance FastAPI).【F:apps/api/app/database.py†L1-L91】
  - `models.py` définit les entités `Product`, `Offer`, `Supplier`, `PriceHistory`, `PriceAlert`.【F:apps/api/app/models.py†L1-L284】
  - `schemas.py` contient les modèles Pydantic v2 alignés avec les réponses du frontend (format Money, DealItem, PriceHistory).【F:apps/api/app/schemas.py†L1-L330】
  - `routers/` sépare les responsabilités CRUD (pagination, filtres, agrégation SQL).【F:apps/api/app/routers/products.py†L105-L479】

- **Tâches asynchrones** : `celery_app.py` configure Celery/Redis, `tasks.py` orchestre scraping + alertes, `scheduler.py` pilote les jobs récurrents (APScheduler).【F:apps/api/app/celery_app.py†L1-L82】【F:apps/api/app/tasks.py†L1-L210】

- **Observabilité** : réponses structurées (`total`, `items`, `limit`, `offset`), gestion des filtres (prix, disponibilité, marque) pour alimenter le frontend et les exports partenaires.【F:apps/api/app/routers/products.py†L105-L304】

## 5. Services et données auxiliaires

- `services/gyms_scraper.py` : scraping Basic-Fit (sélecteur `a.card-location`), retour `name`/`link`/`brand` pour enrichir `/gyms`. Prévoir une gestion d'erreurs plus robuste (captcha, pagination).【F:services/gyms_scraper.py†L1-L27】
- `services/scraper/` : micro-service Python (Poetry) responsable de la collecte de prix depuis les marchands. Il alimente l'agrégateur via `SCRAPER_BASE_URL`.
- `fallback_catalogue.py` : dataset statique pour assurer la disponibilité du comparateur (produits, offres, images, statistiques).【F:fallback_catalogue.py†L1-L160】
- `data/programmes.json` : référentiel exposé par `/programmes` et utilisé par la page Next `/programmes`.【F:data/programmes.json†L1-L200】【F:frontend/src/app/programmes/page.tsx†L1-L88】

## 6. Infrastructure & DevOps

- `docker-compose.yml` lance PostgreSQL, Redis, l'API FastAPI, un worker Celery et le frontend Next.js avec Turbopack.【F:docker-compose.yml†L1-L76】
- Le conteneur frontend exécute `npm run dev` après `npm install`, permettant le hot reload avec montées de volumes (`frontend_node_modules`, `frontend_next`).【F:docker-compose.yml†L60-L76】
- Les secrets et URLs sont passés via variables d'environnement ; un `.env.example` à la racine centralise les valeurs par défaut.

## 7. Points de vigilance pour la reprise

1. **Double stack Next.js** : la présence conjointe de `src/app` et `src/pages/api` nécessite un plan de migration complet vers App Router pour éviter les doublons et incohérences de middleware.【F:frontend/src/pages/api/gyms.js†L1-L200】
2. **Scripts npm racine** : l'ancien shell Vite (React 18) est encore référencé dans `package.json` racine. Décider de sa suppression ou de sa mise à niveau pour éviter les confusions développeurs.【F:package.json†L1-L33】
3. **Gestion des secrets** : plusieurs valeurs par défaut sont stockées en clair (`SERPAPI_KEY`, `FITIDION_WEBHOOK_SECRET` placeholder). Prévoir un vault et la rotation automatique avant mise en production.【F:main.py†L26-L37】【F:apps/api/.env.example†L1-L5】
4. **Tests & QA** : la suite Pytest est minimale, aucune CI n'est configurée. Priorité : ajouter lint + tests dans GitHub Actions et couvrir `/compare`, `/search`, `/api/gyms` (mocks).【F:apps/api/pyproject.toml†L21-L26】
5. **Observabilité** : instrumentation (logs structurés, métriques) encore absente ; prévoir un middleware logging et une intégration APM lors de la reprise.

---

Ce document sert de référence rapide pour comprendre les couches existantes et identifier les chantiers prioritaires avant la reprise du développement Fitidion.
