# Architecture du projet Whey Comparator

Cette documentation décrit la structure complète du dépôt et le rôle de chaque sous-système (backend FastAPI, frontend Next.js, services partagés, infrastructure).

## Vue d'ensemble du dépôt

```
whey-comparator/
├── apps/
│   └── api/                  # Backend FastAPI (Poetry, Alembic, Celery)
├── frontend/                 # Interface Next.js 15 (App Router)
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
- **Public** : assets logos/manifest, favicons.

## Services & scripts partagés

- **`services/`** : connecteurs vers SerpAPI, MyProtein, normalisation d'offres (utilisés par le backend historique ou scripts).
- **`fallback_catalogue.py`** : données statiques pour alimenter le comparateur lorsque les scrapers sont hors ligne.
- **`main.py` (racine)** : expose une version minimaliste de l'API (utile pour prototypage sans Poetry).
- **`index.html`, `src/` (racine)** : reste d'une POC Vite/Tailwind (peut servir pour des tests isolés de composants).

## Orchestration & devops

- **`docker-compose.yml`** : services `api` (FastAPI), `frontend` (Next.js), `db` (PostgreSQL), `redis` (broker Celery). Permet de lancer la stack complète.
- **`requirements.txt`** : dépendances Python rapides (alternative à Poetry pour un setup simplifié).
- **`package.json` (racine)** : scripts Node communs, configuration Vite/Tailwind historique.
- **`docs/`** : référentiel de la documentation (`architecture.md`, `api_endpoints.md`, `design_guidelines.md`, `next_steps.md`).

## Flux de données

1. **Collecte** : Scrapers/Celery alimentent la base `offers`, `suppliers`, `products`.
2. **API** : FastAPI expose les routes CRUD et listes paginées (filtrage, tri) consommées par le frontend.
3. **Frontend** : Next.js 15 récupère les données via `apiClient` (TanStack Query), hydrate les sections marketing et comparateurs.
4. **Fallback** : en cas de panne scraping, `fallback_catalogue.py` et les routes `/api/catalogue` du frontend assurent une UX cohérente.

Cette architecture sépare clairement les responsabilités : FastAPI pour la donnée, Next.js pour l'UI, Celery/Redis pour l'asynchrone et Docker Compose pour l'environnement de développement.
