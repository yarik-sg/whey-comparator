# Architecture FitIdion

Cette note cartographie en détail la structure du dépôt et la façon dont les différentes
couches coopèrent pour livrer l'expérience FitIdion.

## Vue d'ensemble

```
whey-comparator/
├── README.md                      # Guide global & démarrage
├── docs/                          # Documentation produit & technique
├── data/                          # Fichiers de référence (catalogue, historiques, programmes)
├── apps/api/                      # Backend FastAPI orchestré par Poetry
├── frontend/                      # Frontend Next.js 15 (App Router)
├── services/                      # Scrapers & micro-services de collecte
├── main.py                        # API d’agrégation « lite » (FastAPI)
├── fallback_catalogue.py          # Catalogue de secours partagé
├── docker-compose.yml             # Stack locale (Postgres, Redis, API, Front)
└── src/                           # Ancienne POC Vite (rétro-compatibilité)
```

Chaque sous-dossier possède son propre README ou est documenté dans les sections ci-dessous.

## Frontend Next.js (`frontend/`)

| Bloc | Dossier/fichier | Description |
|------|-----------------|-------------|
| App Router | `src/app/layout.tsx` | Layout global, injection des fonts Inter/Poppins et `ThemeProvider` FitIdion. |
| Pages | `src/app/{segment}/page.tsx` | Pages Landing, Catalogue, Comparateur (`comparison`, `comparateur`), Analyse (`analyse`), Programmes, Gyms, Alerts, Search, fiche produit (`products/[id]`). |
| Styles | `src/app/globals.css`, `src/styles/fitidion-theme.css` | Tokens Tailwind (gradients, surfaces vitrées, mode sombre) + classes utilitaires additionnelles. |
| Sections | `src/components/*.tsx` | Composants marketing (HeroSection, DealsShowcase, StatsSection, GymLocatorSection) et modules métier (PriceComparison, PriceHistoryChart, PriceAlertForm, FilterSidebar, QueryProvider, ThemeProvider). |
| Primitives UI | `src/components/ui/*` | Boutons, cartes, inputs, checkbox, slider alignés sur la palette FitIdion. |
| Data layer | `src/lib/apiClient.ts`, `src/lib/queries.ts`, `src/lib/fallbackCatalogue.ts`, `src/lib/gymLocator.ts`, `src/lib/utils.ts` | Client HTTP, hooks TanStack Query, fallback offline partagé avec le backend, helpers de formatage (prix, ratio protéines/prix). |
| Hooks | `src/hooks/useGyms.ts` | Accès aux gyms (API + fallback `services/gyms_scraper.py`). |
| Types | `src/types/api.ts` | Typages TypeScript des entités (Product, Offer, PriceAlert, Gym, Programme). |
| Data statique | `src/data/popularCategories.ts` | Catégories mise en avant sur la page catalogue. |
| Legacy API | `src/pages/api/*.ts` | Routes API historiques (comparateurs partenaires, proxys marchands) conservées pour compatibilité Vercel. |
| Vendor | `vendor/tanstack-query-core/`, `vendor/tanstack-react-query/` | Bundles TanStack Query vendored pour garantir un fonctionnement offline/stable. |

## Backend FastAPI (`apps/api/`)

| Bloc | Fichiers | Description |
|------|----------|-------------|
| Application | `app/main.py` | Instancie FastAPI, configure CORS/logging, monte les routeurs et `/health`. |
| Configuration | `app/config.py` | Paramètres Pydantic Settings (`API_DATABASE_URL`, `API_CELERY_*`, `API_ALLOWED_ORIGINS`, etc.). |
| Persistence | `app/database.py`, `app/models.py`, `app/schemas.py` | Connexion SQLAlchemy + modèles ORM (Product, Offer, Supplier, PriceHistory, PriceAlert, ScrapeJob) + schémas Pydantic (lecture/écriture, pagination). |
| Routes REST | `app/routers/{products,offers,suppliers,price_alerts}.py` | Endpoints CRUD et historique de prix exposés au frontend. |
| Traitements asynchrones | `app/celery_app.py`, `app/tasks.py`, `app/scheduler.py`, `app/email.py` | Worker Celery (Redis), tâches de scraping/notifications, planification APScheduler, gabarits d’emails. |
| Migrations | `alembic.ini`, `alembic/versions/*.py` | Évolution du schéma SQL alignée sur les modèles. |
| Tests | `tests/test_products.py`, `tests/test_offers.py`, `tests/test_price_alerts.py`, `tests/conftest.py` | Vérifications Pytest/HTTPX des routes principales (CRUD, pagination, validations). |
| Dépendances | `pyproject.toml` | Gestion Poetry du backend (FastAPI, SQLAlchemy, Celery, APScheduler, Redis, pytest…). |

## API d’agrégation (`main.py`, `fallback_catalogue.py`)

- `main.py` expose une API FastAPI légère utilisée pour prototyper les endpoints agrégés (`/products`, `/comparison`, `/search`, `/gyms`, `/programmes`, `/price-alerts`).
- `fallback_catalogue.py` regroupe le catalogue de secours partagé avec `frontend/src/lib/fallbackCatalogue.ts` et fournit les données offline pour l’API légère.

## Services de collecte (`services/`)

- `services/gyms_scraper.py` : scraping Basic-Fit/partenaires (requests + BeautifulSoup) enrichi avec géocodage, utilisé par l’endpoint `/gyms` et la recherche unifiée.
- `services/scraper/` (package Poetry) :
  - `src/scraper/collectors/` : connecteurs de scraping multi-marchands.
  - `src/scraper/normalization/` : normalisation des prix, unités et promotions.
  - `src/scraper/cache.py`, `database.py`, `crud.py` : persistance/cache locale.
  - `src/scraper/scheduler.py` : planification des collectes.

## Données & synchronisation (`data/`)

- `programmes.json` : référentiel des programmes sportifs pour `GET /programmes` et `frontend/src/app/programmes`.
- Les autres fallbacks (catalogue, historiques) sont stockés dans `fallback_catalogue.py` et servis directement par `main.py`.

## Orchestration & environnements

- `docker-compose.yml` : orchestrateur Postgres, Redis, API FastAPI (`apps/api`), worker Celery et frontend Next.js (`frontend`).
- `tailwind.config.ts` (racine) : tokens FitIdion partagés pour la POC Vite (`src/`) et les outils design.
- `package.json` & `requirements.txt` (racine) : scripts historiques (Vite) et dépendances de l’API légère.
- Les environnements `.env` attendus sont détaillés dans les README dédiés (frontend, backend).

## Flux fonctionnel FitIdion

1. **Collecte & normalisation** : `services/scraper` et `services/gyms_scraper.py` alimentent Postgres via Celery et entretiennent les JSON fallback.
2. **Orchestration backend** : `apps/api/app` expose les CRUD, historise les prix (`PriceHistory`) et gère les alertes (`PriceAlert`).
3. **Agrégation** : `main.py` fusionne données live, fallback et résultats scrapers pour servir les endpoints riches (comparateur, recherche unifiée, analytics prix).
4. **Expérience utilisateur** : le frontend consomme `apps/api` et `main.py` via `src/lib/queries.ts`, met en scène les données (Hero, comparateur, alertes) et applique la charte FitIdion.
5. **Boucle alertes** : l’utilisateur active une alerte (`frontend/src/components/CreatePriceAlert.tsx` → `POST /price-alerts`), Celery surveille les prix, `app/email.py` gère les notifications.

---

🧠 *FitIdion sépare nettement collecte, orchestration et expérience pour garantir résilience, performance et cohérence produit.*
