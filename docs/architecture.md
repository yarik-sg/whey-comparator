# Architecture FitIdion

Cette note cartographie en détail la structure du dépôt et la façon dont les différentes
couches coopèrent pour livrer l'expérience FitIdion.

## Vue d'ensemble

```
whey-comparator/
├── README.md                      # Guide global & démarrage
├── main.py                        # 🚀 Backend FastAPI principal (point d'entrée)
├── requirements.txt               # Dépendances Python du backend
├── fallback_catalogue.py          # Catalogue de secours partagé
├── render.yaml                    # Configuration déploiement Render
├── docs/                          # Documentation produit & technique
├── data/                          # Fichiers de référence (programmes, gyms)
├── apps/api/                      # Backend avancé (Poetry, SQLAlchemy, Celery)
├── frontend/                      # Frontend Next.js 15 (App Router)
├── services/                      # Scrapers & micro-services de collecte
├── docker-compose.yml             # Stack locale (Postgres, Redis, API, Front)
└── src/                           # Prototype UI historique (archivé)
```

## Schéma d'architecture

```mermaid
flowchart TD
  user((Utilisateur))
  next[Frontend Next.js\nApp Router (SSR)]
  fastapi[API FastAPI\nmain.py - Agrégation]
  serp[SerpAPI]
  gyms[APIs / Scraper gyms]
  fallback[(Données locales\nfallback)]

  user --> next
  next -->|Requêtes SSR & client| fastapi
  fastapi --> serp
  fastapi --> gyms
  fastapi --> fallback
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
| SSR & comparaison | `src/app/comparison/page.tsx` | Composant serveur `async` avec `cache: "no-store"` pour pré-rendre les comparaisons et hydrater les interactions côté client. |
| Legacy API | `src/pages/api/*.ts` | Routes API historiques (comparateurs partenaires, proxys marchands) conservées pour compatibilité Vercel. |

## Backend principal (`main.py`, `fallback_catalogue.py`)

Le backend principal à la **racine du projet** est utilisé pour le déploiement sur Render :

- `main.py` expose une API FastAPI complète pour les endpoints agrégés (`/products`, `/comparison`, `/search`, `/gyms`, `/programmes`, `/price-alerts`).
- Combine les résultats SerpAPI, les scrapers internes et le catalogue de secours.
- `fallback_catalogue.py` regroupe le catalogue de secours partagé avec `frontend/src/lib/fallbackCatalogue.ts`.

**Déploiement Render** :
```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Variables d'environnement** :
- `SERPAPI_KEY` : clé API SerpAPI pour les recherches produits.
- `SCRAPER_BASE_URL` : URL du scraper externe (optionnel).
- `API_CACHE_TTL_SECONDS` : durée du cache en secondes (défaut : 120).
- `FORCE_IMAGE_HTTPS` : forcer HTTPS pour les images (défaut : true).

## Backend avancé (`apps/api/`) — Optionnel

Ce backend optionnel fournit une persistance PostgreSQL, des workers Celery et des alertes planifiées.
**Pour un déploiement simple, le backend principal (`main.py`) suffit.**

| Bloc | Fichiers | Description |
|------|----------|-------------|
| Application | `app/main.py` | Instancie FastAPI, configure CORS/logging, monte les routeurs et `/health`. |
| Configuration | `app/config.py` | Paramètres Pydantic Settings (`API_DATABASE_URL`, `API_CELERY_*`, etc.). |
| Persistence | `app/database.py`, `app/models.py`, `app/schemas.py` | Connexion SQLAlchemy + modèles ORM. |
| Routes REST | `app/routers/*.py` | Endpoints CRUD et historique de prix. |
| Traitements asynchrones | `app/celery_app.py`, `app/tasks.py`, `app/scheduler.py` | Worker Celery (Redis), planification APScheduler. |
| Migrations | `alembic/` | Évolution du schéma SQL. |
| Tests | `tests/` | Vérifications Pytest/HTTPX. |
| Dépendances | `pyproject.toml` | Gestion Poetry. |

## Services de collecte (`services/`)

- `services/gyms_scraper.py` : scraping Basic-Fit/partenaires (requests + BeautifulSoup) enrichi avec géocodage, utilisé par l'endpoint `/gyms` et la recherche unifiée.
- `services/scraper/` (package Poetry) :
  - `src/scraper/collectors/` : connecteurs de scraping multi-marchands.
  - `src/scraper/normalization/` : normalisation des prix, unités et promotions.
  - `src/scraper/cache.py`, `database.py`, `crud.py` : persistance/cache locale.
  - `src/scraper/scheduler.py` : planification des collectes.

## Données & synchronisation (`data/`)

- `programmes.json` : référentiel des programmes sportifs pour `GET /programmes` et `frontend/src/app/programmes`.
- Les autres fallbacks (catalogue, historiques) sont stockés dans `fallback_catalogue.py` et servis directement par `main.py`.

## Orchestration & environnements

- `docker-compose.yml` : orchestrateur Postgres, Redis, API FastAPI, worker Celery et frontend Next.js.
- `render.yaml` : configuration de déploiement Render pour le backend principal.
- `frontend/vercel.json` : configuration de déploiement Vercel pour le frontend.
- `tailwind.config.ts` (racine) : tokens FitIdion partagés pour le design system commun.
- `package.json` & `requirements.txt` (racine) : scripts de pilotage et dépendances du backend.
- Les environnements `.env` attendus sont détaillés dans les README dédiés (frontend, backend).

## Flux fonctionnel FitIdion

1. **Collecte & normalisation** : `services/scraper` et `services/gyms_scraper.py` alimentent les données et entretiennent les JSON fallback.
2. **Backend principal** : `main.py` fusionne données live, fallback et résultats scrapers pour servir les endpoints riches (comparateur, recherche unifiée, analytics prix).
3. **Orchestration avancée** (optionnel) : `apps/api/app` expose les CRUD, historise les prix (`PriceHistory`) et gère les alertes (`PriceAlert`) avec persistance PostgreSQL.
4. **Expérience utilisateur** : le frontend consomme l'API via `src/lib/queries.ts`, met en scène les données (Hero, comparateur, alertes) et applique la charte FitIdion.
5. **Boucle alertes** : l'utilisateur active une alerte (`frontend/src/components/CreatePriceAlert.tsx` → `POST /price-alerts`), le backend surveille les prix et envoie les notifications.

---

🧠 *FitIdion sépare nettement collecte, orchestration et expérience pour garantir résilience, performance et cohérence produit.*
