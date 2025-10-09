# Architecture du projet Whey Comparator

Cette documentation décrit la structure complète du dépôt et le rôle de chaque sous-système (backend FastAPI, frontend Next.js, services partagés, infrastructure).

## Vue d'ensemble du dépôt

```
whey-comparator/
├── apps/
│   └── api/                  # Backend FastAPI (Poetry, Alembic, Celery)
├── frontend/                 # Interface Next.js 15 (App Router)
│   ├── Dockerfile            # Image de développement (Turbopack, hot reload)
│   └── src/                  # Pages, composants, librairies front
├── services/                 # Clients scrapers & intégrations externes
├── src/                      # Scripts Python utilitaires (fallback)
├── docs/                     # Documentation fonctionnelle & technique
├── docker-compose.yml        # Orchestration locale (API + DB + Redis + frontend)
├── main.py                   # Entrée API FastAPI simplifiée (mode standalone)
├── fallback_catalogue.py     # Dataset fallback si scraping indisponible
└── package.json              # Dépendances Node partagées (scripts utilitaires)
```

## Backend (`apps/api`)

- **`app/main.py`** : configuration FastAPI, CORS, montage des routeurs `products`, `suppliers`, `offers`, healthcheck.
- **`app/config.py`** : paramètres pydantic (préfixe `API_`), URLs base de données & Celery.
- **`app/database.py`** : moteur SQLAlchemy, session locale, dépendances pour injection dans les routes.
- **`app/models.py`** : ORM complet (Product, Supplier, Offer, ScrapeJob) avec mixin de timestamps.
- **`app/schemas.py`** : schémas Pydantic v2 (CRUD + pagination).
- **`app/routers/`** : endpoints REST modulaires.
- **`app/tasks.py` / `app/celery_app.py`** : tâches Celery simulant le scraping avec stockage de logs.
- **`alembic/`** : migrations de base de données.
- **`tests/`** : scénarios Pytest/HTTPX (smoke tests, validations).

## Frontend (`frontend`)

- **App Router** : pages dans `src/app/` (landing marketing, comparateur SSR, comparateur express client, catalogue).
- **Composants** : `src/components/` regroupe les sections marketing (HeroSection, DealsShowcase, StatsSection, PartnerLogos, WhyChooseUs, PriceAlertsSection) et primitives dans `components/ui`.
- **Lib réseau** : `src/lib/apiClient.ts` résout la base API et centralise les appels (TanStack Query vendored dans `vendor/`).
- **Styles** : `src/app/globals.css` définit les tokens CSS (`--background`, `--accent`, `--font-*`) et Tailwind 4 est importé en tête de fichier.
- **Dockerfile** : image basée sur Node 20-alpine, `npm ci`, hot reload via `next dev --turbopack` accessible en conteneur.
- **Public** : assets logos/manifest, favicons.

## Services & scripts partagés

- **`services/`** : connecteurs vers SerpAPI, MyProtein, normalisation d'offres (utilisés par le backend historique ou scripts).
- **`fallback_catalogue.py`** : données statiques pour alimenter le comparateur lorsque les scrapers sont hors ligne.
- **`main.py` (racine)** : expose une version minimaliste de l'API (utile pour prototypage sans Poetry).
- **`index.html`, `src/` (racine)** : reste d'une POC Vite/Tailwind (peut servir pour des tests isolés de composants).

## Orchestration & devops

- **`docker-compose.yml`** : services `db` (PostgreSQL), `redis` (broker Celery), `api` (FastAPI avec `--reload`), `worker` (Celery) et `frontend` (Next.js). Les volumes nommés préservent `postgres_data`, `node_modules` et `.next` pour accélérer les redémarrages.
- Les variables d'environnement (`API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `API_DATABASE_URL`, etc.) sont injectées directement dans les conteneurs pour relier l'UI et le backend sans configuration manuelle.
- **Lancement** : `docker compose up --build` met en route la stack complète avec hot reload côté API et frontend. `docker compose down -v` réinitialise les données.
- **Développement hybride** : il est toujours possible de lancer `uvicorn main:app --reload` ou `npm run dev` en local si l'on souhaite travailler hors conteneurs.

## Flux de données

1. **Collecte** : Scrapers/Celery alimentent la base `offers`, `suppliers`, `products`.
2. **API** : FastAPI expose les routes CRUD et listes paginées (filtrage, tri) consommées par le frontend.
3. **Frontend** : Next.js 15 récupère les données via `apiClient` (TanStack Query), hydrate les sections marketing et comparateurs.
4. **Fallback** : en cas de panne scraping, `fallback_catalogue.py` et les routes `/api/catalogue` du frontend assurent une UX cohérente.

Cette architecture sépare clairement les responsabilités : FastAPI pour la donnée, Next.js pour l'UI, Celery/Redis pour l'asynchrone et Docker Compose pour l'environnement de développement.
