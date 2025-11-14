# BACKEND

## Aperçu
FitIdion expose deux couches backend complémentaires :
1. **API légère (`main.py`)** — FastAPI monolithique utilisé en production pour servir les pages Next.js en temps réel.
2. **Backend complet (`apps/api`)** — FastAPI + SQLAlchemy + Celery pour l'ingestion, les historiques et les alertes. Cette API peut remplacer la version légère dès que l'infrastructure Postgres/Redis est disponible.

Les deux couches partagent les mêmes concepts (`Product`, `Offer`, `PriceHistory`, `PriceAlert`). Le frontend consomme exclusivement les routes publiques documentées ci-dessous.

## API FastAPI légère (`main.py`)
- Localisation : racine du dépôt (`main.py`).
- Démarrage rapide :
  ```bash
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
  ```
- Variables d'environnement :
  | Nom | Description |
  |-----|-------------|
  | `SERPAPI_KEY` | Clé SerpAPI (obligatoire, aucune valeur par défaut ne doit rester en production). |
  | `SCRAPERAPI_KEY` | Clé ScraperAPI (facultative si vous n'utilisez que SerpAPI). |
  | `SCRAPER_BASE_URL` | Passerelle interne vers vos scrapers (défaut `http://localhost:8001`). |
  | `FORCE_IMAGE_HTTPS` | `true/false` pour forcer le HTTPS sur les images. |
  | `API_CACHE_TTL_SECONDS` | TTL du middleware de cache HTTP (par défaut 120s). |

### Endpoints principaux
| Méthode & Route | Description | Format de réponse |
|-----------------|-------------|-------------------|
| `GET /` | Ping simple. | `{ "message": "API OK ..." }`
| `GET /compare` | Comparaison détaillée. Deux formats : `legacy=true` renvoie `DealItem[]`; mode par défaut renvoie `ProductComparisonResponse` (`query`, `product`, `price_stats`, `offers`, `history`). |
| `GET /products` | Catalogue produit enrichi (filtres `search`, `brands`, `min_price`, `max_price`, `category`, `min_rating`, `in_stock`, `sort`). | `{ products: ProductSummary[], pagination: {...} }` |
| `GET /products/{id}/offers` | Offre détaillée par produit (mélange SERP + scrapers). | `{ product: ProductSummary, offers: DealItem[], sources: { scraper: ScraperOffer[] } }` |
| `GET /products/{id}/price-history` | Historique agrégé (période `period` = `7d/1m/3m/6m/1y`). | `PriceHistoryResponse` |
| `GET /products/{id}/reviews` | Synthèse des avis (distribution 1‑5 étoiles, highlights). | `ProductReviewsResponse` |
| `GET /products/{id}/similar`, `/products/{id}/related` | Suggestions produits (basées sur catégorie/marque). | `{ similar: ProductSummary[] }` |
| `GET /comparison` | Comparaison multi-produits (paramètre `ids` CSV). | `{ products: ComparisonEntry[], summary: DealItem[] }` |
| `GET /gyms` | Listing simplifié en temps réel (scraping partenaires). | `List[Gym]` |
| `GET /api/gyms` | Endpoint legacy/SPA avec pagination, filtres (`city`, `max_distance_km`, `lat`, `lng`). | `{ gyms: [...], meta: {...} }` |
| `GET /search` | Recherche unifiée produits/gyms/programmes. | `{ products: [...], gyms: [...], programmes: [...] }` |
| `GET /programmes` | Programmes d'entraînement statiques (JSON). | `List[Programme]` |

### Compatibilité legacy
- La page `/comparateur` (App Router) doit appeler `GET /compare?legacy=true` pour recevoir une liste `DealItem[]` conforme à `frontend/src/types/api.ts`.
- La nouvelle page `/compare` consomme l'objet structuré via la route Next `/api/compare`.
- Tous les endpoints `/products/{id}/...` conservent les noms camelCase historiques (`bestPrice`, `pricePerKg`, etc.) pour rester compatibles avec l'ancien SPA.

### Services appelés
- `services/product_compare.py` :
  - `compare_product` agrège SerpAPI (`fetch_serpapi_offers`, `fetch_serpapi_product_offers_bulk`) et ScraperAPI.
  - Cache en mémoire avec TTL configurable (`COMPARE_CACHE_TTL_SECONDS`).
- `services/gyms_scraper.py` :
  - `get_partner_gyms(brands, limit)` fusionne Basic-Fit/Fitness Park/Neoness/On Air.
  - `local_cache` stocke les JSON de fallback (`data/gyms_fallback.json`).

## Backend complet `apps/api`
- Localisation : `apps/api`.
- Installation :
  ```bash
  cd apps/api
  poetry install
  poetry run uvicorn app.main:app --reload --port 8100
  ```
- Services complémentaires :
  - **PostgreSQL** pour `app/models.py`.
  - **Redis** pour Celery/Beat et l'ordonnanceur APScheduler (`app/scheduler.py`).
  - **Celery** (`poetry run celery -A app.celery_app worker -l info`).

### Routers disponibles
| Router | Endpoints clés |
|--------|----------------|
| `products` | `GET /products`, `GET /products/{id}`, `GET /products/{id}/offers`, `GET /products/{id}/price-history`, `GET /products/{id}/reviews`. Les réponses utilisent `schemas.ProductSummary` et `schemas.DealItem` (voir `app/schemas.py`). |
| `offers` | CRUD complet (`GET /offers`, `POST /offers`, `PUT/DELETE /offers/{id}`) avec enregistrement automatique de l'historique de prix. |
| `prices` | Endpoints spécialisés pour l'historique (`GET /api/prices/{product_id}`) et la génération de graphiques. |
| `suppliers` | CRUD fournisseurs (ajout de nouveaux marchands pour les scrapers internes). |
| `price-alerts` | CRUD/activation d'alertes utilisateurs.

### Guide pour ajouter un nouveau fournisseur externe
1. **Définir la source** dans `apps/api/app/models.py` (table `Supplier`).
2. **Ajouter le scraper** dans `services/` ou `services/scraper/src` avec un adaptateur qui renvoie `ScraperOffer`.
3. **Mettre à jour** `services/product_compare.py` si le fournisseur nécessite un traitement spécifique (ex. extraction du prix ou des frais de port).
4. **Documenter** la clé/API dans `.env` et `docs/PRODUCT_COMPARE_FLOW.md`.
5. **Tester** en local via `GET /compare?q=...` et `GET /products/{id}/offers`.

### Modes legacy/support
- `/compare?legacy=true` reste supporté tant que les pages Next historiques ne consomment pas l'objet structuré.
- Les endpoints `/api/gyms` et `/comparison` conservent les champs `snake_case` hérités (`distance_km`, `estimated_duration`).
- Lorsque `apps/api` remplace `main.py`, exposer des endpoints « public » qui gardent la même forme JSON (via `@router.get(..., response_model=schemas.LegacyProductSummary)` si nécessaire).

## Monitoring et résilience
- Activer le middleware de cache `simple_cache_middleware` (déjà présent) et surveiller les ratios `X-Cache: HIT/MISS`.
- Les appels SerpAPI/ScraperAPI doivent être protégés par des timeouts (`httpx.AsyncClient(timeout=10)` recommandé) et des retries limités.
- Les scrapers salles utilisent `requests` sans retries : envisager `httpx` ou `tenacity` pour fiabiliser.

## Liens utiles
- Flux complet du comparateur : `docs/PRODUCT_COMPARE_FLOW.md`.
- Architecture globale : `docs/ARCHITECTURE.md`.
- Référence API : `docs/API_REFERENCE.md`.
