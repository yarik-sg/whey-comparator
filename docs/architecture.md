# Architecture FitIdion

Cette note décrit la structure actuelle du dépôt FitIdion et la manière dont les différents modules
coopèrent pour délivrer le comparateur fitness intelligent.

## Vue d'ensemble

```
whey-comparator/
├── README.md
├── docs/                      # Guides FitIdion (architecture, design, roadmap)
├── tailwind.config.ts         # Thème FitIdion partagé (Vite + Next)
├── frontend/                  # Application Next.js 15 / React 19
│   ├── package.json           # Dépendances UI (lucide-react, framer-motion…)
│   ├── src/app/               # Pages App Router, layout FitIdion, globals.css
│   ├── src/components/        # Sections marketing + primitives UI (buttons, cards…)
│   ├── src/lib/               # Clients API, hooks TanStack Query, catalogue fallback
│   └── public/                # Assets (logos à uploader manuellement, manifest placeholders)
├── apps/api/                  # Backend FastAPI (Poetry, SQLAlchemy, Celery)
│   ├── app/                   # Routes CRUD, schémas Pydantic, tâches Celery
│   ├── alembic/               # Migrations base de données
│   └── tests/                 # Scénarios Pytest/HTTPX
├── services/                  # Connecteurs scraping & utilitaires (SerpAPI, proxies…)
├── main.py                    # API FastAPI « lite » pour prototypage rapide
├── fallback_catalogue.py      # Données de secours FitIdion
├── docker-compose.yml         # Orchestration locale (Postgres, Redis, API, Frontend)
└── src/, package.json         # Ancienne POC Vite (toujours disponible pour tests isolés)
```

## Frontend Next.js

- **Design System FitIdion** : `frontend/src/app/globals.css` définit les tokens CSS
  (gradients, surfaces vitrées, mode sombre). Les composants `ui/` encapsulent les
  styles (boutons, inputs, cards, checkbox, slider) et intègrent la palette FitIdion.
- **Layout & theming** : `layout.tsx` charge Inter + Poppins, applique le `ThemeProvider`
  FitIdion (stockage local + détection système) et ajoute `BrandHeader`, `SiteHeader`, `SiteFooter` remaniés.
- **Expérience produit** : sections marketing (HeroSection, DealsShowcase, StatsSection,
  GymLocatorSection…) tirent parti des nouvelles classes FitIdion et du QueryProvider.
- **API client** : `src/lib/apiClient.ts` et `src/lib/queries.ts` orchestrent l'accès
  aux endpoints (TanStack Query vendored dans `vendor/`).

## Backend FastAPI

- **`apps/api/app`** : expose les routes CRUD (`products`, `offers`, `suppliers`, `price-alerts`),
  gère la persistence SQLAlchemy, Celery pour l'orchestration scraping et la configuration Pydantic.
- **`main.py` (racine)** : API d'agrégation temps réel utilisée par le frontend (fusion
  scrapers + fallback catalogue, calcul des indicateurs, sélection des meilleurs deals).
- **`fallback_catalogue.py`** : source de vérité de secours synchronisée avec les composants
  frontend (`src/lib/fallbackCatalogue.ts`).

## Services & données

- **`services/`** contient les clients scrapers, normalisation des prix et utilitaires
  de géocodage utilisés par l'API ou les workers Celery.
- Les logos FitIdion et le favicon sont exclus du dépôt Git ; des placeholders texte sont
  présents dans `frontend/public/` et `frontend/src/app/` et devront être remplacés via GitHub
  après merge.

## Orchestration

- `docker-compose.yml` installe Postgres, Redis, API FastAPI (`uvicorn --reload`), worker Celery
  et frontend Next.js (`next dev --turbopack`). Les volumes nommés conservent la base, les
  dépendances npm et le cache `.next` pour accélérer les itérations.
- Les variables d'environnement (`API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `API_DATABASE_URL`,
  etc.) sont injectées automatiquement.
- Pour un développement manuel, lancer `uvicorn main:app --reload` et `npm run dev` (frontend) reste
  possible.

## Flux fonctionnel

1. **Collecte** : les scrapers alimentent Postgres via Celery (`offers`, `products`, `suppliers`).
2. **Agrégation** : `main.py` fusionne données live + fallback, calcule les métriques FitIdion
   (ratio protéines/prix, disponibilité, fiabilité marchands).
3. **Frontend** : Next.js consomme les endpoints via TanStack Query, rend le comparateur,
   les fiches produits, les alertes et la page catalogue (composants server + client).
4. **Alertes** : `apps/api` stocke les alertes, le worker envoie les notifications (mail / webhook).

---

🧠 *FitIdion sépare nettement données, orchestration et expérience utilisateur pour favoriser la
scalabilité de la plateforme fitness intelligente.*
