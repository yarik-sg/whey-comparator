# ARCHITECTURE

Ce document résume l'architecture FitIdion (Next.js 15 + FastAPI + services Python) et la carte des dépendances.

## Vue d'ensemble
- **Frontend** : application Next.js 15 (App Router) située dans `frontend/`. Elle consomme les API exposées par `main.py` et, si besoin, le backend complet `apps/api` via les routes `/api/*` de Next.
- **API légère (`main.py`)** : FastAPI autonome, stateless, qui expose les endpoints publics (`/compare`, `/products`, `/gyms`, `/search`, `/comparison`, etc.) et orchestre les services SerpAPI/ScraperAPI.
- **Backend complet (`apps/api`)** : projet FastAPI/SQLAlchemy avec tâches Celery pour l'ingestion, l'historique de prix et les alertes e-mail. Il partage les mêmes modèles conceptuels (`Product`, `Offer`, `PriceHistory`, `PriceAlert`).
- **Services Python** : scripts utilitaires dans `services/` (agrégateur SerpAPI/ScraperAPI, scrapers salles, cache local) et sous-projet `services/scraper` pour les scrapers dédiés.
- **Données** : JSON statiques (`data/*.json`, `fallback_catalogue.py`) servant de repli lorsque SerpAPI ou les scrapers ne répondent pas.

## Diagramme simplifié
```
┌──────────────────────────────┐        ┌─────────────────────────┐
│ Next.js 15 (frontend/)       │        │ FastAPI léger (main.py) │
│ • Pages produits/comparateur │ <────► │ • /compare, /products   │
│ • API routes /api/*          │  REST  │ • /gyms, /search        │
└─────────────┬────────────────┘        └─────────┬───────────────┘
              │ SSR/proxy                               │ appelle
              ▼                                         ▼
       ┌──────────────┐                        ┌────────────────────┐
       │ API interne  │◄───────cache────────── │ Services Python    │
       │ (/api/proxy) │                        │ • product_compare  │
       └────┬─────────┘                        │ • gyms_scraper     │
            │                                   └────┬──────────────┘
            ▼                                        │ HTTP
      ┌────────────┐                                 ▼
      │ apps/api   │  ↔  PostgreSQL / Redis  ↔  SerpAPI / ScraperAPI / partenaires
      │ (SQLAlchemy│
      │ + Celery)  │
      └────────────┘
```

## Carte des modules
| Module | Description | Dépendances clés |
|--------|-------------|------------------|
| `frontend/src/app/*` | Pages App Router (produits, comparateur, comparateur historique `/compare`, dashboard). | `@/lib/apiClient`, `@tanstack/react-query`, API `/compare`, `/products`, `/price-alerts`. |
| `frontend/src/app/api/*` | Routes API Next (proxy HTTP générique, `/api/compare`, `/api/catalogue/serp`). | `@/lib/apiClient`, `main.py`.
| `frontend/src/lib/apiClient.ts` | Client HTTP universel (support proxy, fetch server/client, `cache: "no-store"`). | `fetch`, Next.js runtime, env `NEXT_PUBLIC_API_BASE_URL`/`API_BASE_URL`.
| `main.py` | FastAPI légère, endpoints publics, agrégation SerpAPI/Scraper, fallback catalogue. | `services/product_compare`, `services/gyms_scraper`, `fallback_catalogue`, SerpAPI/ScraperAPI.
| `services/product_compare.py` | Pipeline `/compare` moderne : fetch SerpAPI, ScraperAPI, normalisation, cache en mémoire. | `httpx`, env `SERPAPI_KEY`, `SCRAPERAPI_KEY`, `local_cache`.
| `services/gyms_scraper.py` | Scraping Basic-Fit/Fitness Park/Neoness/On Air avec fallback JSON. | `requests`, `BeautifulSoup`, `local_cache`.
| `apps/api/app/*` | Backend complet : modèles SQLAlchemy, routers (produits/offres/prix/alertes), Celery, scheduler. | PostgreSQL, Redis, Celery, env `DATABASE_URL`, `REDIS_URL`.
| `services/local_cache.py` | Cache JSON local partagé par les scrapers. | `Pathlib`, verrou `threading.Lock`.

## Schéma de données global
- **Produit (`ProductSummary`)** : `id`, `name`, `brand`, `category`, `image`, `bestPrice { amount, currency, formatted }`, `offersCount`, `proteinPerEuro`, `pricePerKg`, `rating`, `reviewsCount`, `bestVendor`. (Voir `frontend/src/types/api.ts`).
- **Offre (`DealItem`)** : `id`, `title`, `vendor`, `price`, `totalPrice`, `shippingCost`, `shippingText`, `link`, `image`, `rating`, `reviewsCount`, `bestPrice`, `source`, `productId`.
- **Historique de prix** : `PriceHistoryPoint` (`date`, `price`, `currency`, `platform`, `in_stock`) et `PriceHistoryStatistics` pour les analyses.
- **Alertes prix** : `PriceAlertRecord` contient `user_email`, `product_id`, `target_price`, `platform`, `active`, `created_at`.
- **Comparaison moderne** : `ProductComparisonResponse` (query, product, price_stats, offers[], history[]), converti côté frontend en format UI (camelCase) via `frontend/src/app/api/compare/route.ts`.

## Flux de dépendances
1. La page `/comparateur` consomme directement `GET /compare?legacy=true` via `apiClient`.
2. La page `/compare` passe par `/api/compare` (route Next) qui appelle `GET /compare` (sans legacy) pour récupérer l'objet structuré.
3. Les listes de produits/alertes utilisent `GET /products`, `GET /products/{id}/reviews` et `GET /price-alerts/` exposés par `main.py`.
4. Les services Python contactent SerpAPI et ScraperAPI, puis stockent des instantanés dans `local_cache` pour servir de fallback.
5. Le backend complet `apps/api` peut être déployé séparément ; il partage les mêmes schémas et peut alimenter `main.py` via HTTP ou via une base commune.

Pour plus de détails sur le flux comparateur et l'intégration des services externes, voir `docs/PRODUCT_COMPARE_FLOW.md`.
