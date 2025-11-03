# Fitidion — plateforme du fitness intelligent

Fitidion (anciennement Whey Comparator) centralise comparaison de compléments, suivi d'offres et repérage de salles de sport. La plateforme repose sur un frontend Next.js 15 (React 19) utilisant Tailwind CSS 4 et shadcn/ui, un service FastAPI d'agrégation de données temps réel (`main.py`) et une API modulaire FastAPI/SQLAlchemy située dans `apps/api` pour la gestion CRUD du catalogue. Le service d'agrégation combine SerpAPI, scrapers internes et un catalogue de secours pour garantir un résultat même hors ligne.

## Stack technique

| Côté | Technologies principales |
|------|--------------------------|
| Frontend | Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 (@tailwindcss/postcss), shadcn/ui maison, TanStack Query 5, Recharts, Framer Motion |
| Agrégation | FastAPI, uvicorn, intégration SerpAPI, fallback JSON (`fallback_catalogue.py`), scraping Basic-Fit (`services/gyms_scraper.py`) |
| API métier | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL, Celery + Redis pour les tâches asynchrones |
| Data & tooling | Docker Compose, Poetry, npm, ESLint (flat config), TypeScript strict |

## Structure du dépôt

```
whey-comparator/
├── README.md                  # Vue d'ensemble + instructions rapides
├── .env.example               # Variables partagées frontend/backend
├── apps/
│   └── api/                   # API REST principale (Poetry, SQLAlchemy)
├── frontend/                  # Application Next.js 15 App Router
│   ├── src/app/               # Pages App Router + API routes (proxy, alerts, image-proxy)
│   ├── src/pages/api/         # Anciennes routes Pages Router à désactiver/migrer
│   ├── src/lib/               # Clients API, gestion env, helpers (images, queries)
│   └── vendor/                # TanStack Query vendored pour React 19
├── main.py                    # API FastAPI d'agrégation (produits, comparaison, gyms)
├── services/                  # Scrapers Python (gyms, catalogue prix)
├── data/programmes.json       # Données programmes sportifs exposées via l'API
├── docs/
│   ├── ARCHITECTURE.md        # Cartographie technique Fitidion
│   └── SETUP.md               # Installation locale détaillée
├── docker-compose.yml         # Stack complète (Postgres, Redis, API, frontend)
├── tailwind.config.ts         # Tokens design partagés (thème Fitidion)
├── package.json               # Scripts historiques Vite + lint frontend
├── requirements.txt           # Dépendances du service d'agrégation léger
└── apps/api/pyproject.toml    # Dépendances de l'API métier (Poetry)
```

## Installation & lancement local

### 1. Démarrage rapide avec Docker Compose

```bash
docker compose up --build
```

- Frontend : <http://localhost:3000>
- API d'agrégation : <http://localhost:8000> (`/docs`)
- PostgreSQL : port 5432 (login `postgres` / `postgres`)
- Redis : port 6379

Les conteneurs montent les volumes du dépôt pour le rechargement à chaud. Arrêt : `docker compose down` (ajoutez `-v` pour purger les volumes).

### 2. Installation manuelle

#### Pré-requis

- Node.js >= 20
- Python >= 3.12
- PostgreSQL + Redis en local (ou via containers séparés)
- Poetry (`pipx install poetry`)

#### API d'agrégation (FastAPI léger)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Variables utiles : `SERPAPI_KEY`, `SCRAPER_BASE_URL`, `FORCE_IMAGE_HTTPS`.

#### API métier (apps/api)

```bash
cd apps/api
poetry install
poetry run alembic upgrade head
poetry run uvicorn app.main:app --reload
```

Lancer le worker Celery pour les alertes : `poetry run celery -A app.tasks worker --loglevel=INFO`.

#### Frontend Next.js 15

```bash
cd frontend
npm install
cp ../.env.example .env.local  # à adapter
npm run dev -- --hostname 0.0.0.0 --port 3000
```

La variable `API_BASE_URL` doit pointer vers l'API (ex : `http://localhost:8000`). `NEXT_PUBLIC_API_BASE_URL` est utilisée côté navigateur. Les routes App Router utilisent `/api/proxy?target=…` pour relayer les requêtes vers FastAPI.

## API disponibles

### API d'agrégation (`main.py`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Ping JSON (`{"message": "API OK ✅ — utilise /compare?q=whey protein"}`) pour le monitoring. |
| GET | `/products` | Catalogue agrégé avec filtres (search, prix, tri, pagination) et fallback local.【F:main.py†L2506-L2607】|
| GET | `/products/{product_id}/offers` | Détail d'un produit et des offres disponibles (sources multiples).【F:main.py†L3012-L3056】|
| GET | `/products/{product_id}/price-history` | Historique de prix agrégé avec statistiques.【F:main.py†L3071-L3130】|
| GET | `/compare` | Comparateur multi-produits (paramètres `ids` ou `q`).【F:main.py†L2854-L3005】|
| GET | `/search` | Recherche unifiée (produits, gyms, programmes).【F:main.py†L2289-L2360】|
| GET | `/programmes` | Retourne `data/programmes.json` (routines d'entraînement).【F:main.py†L2151-L2197】|
| GET | `/gyms` | Liste enrichie des salles (mock + scraping Basic-Fit).【F:main.py†L193-L237】|
| GET | `/api/gyms` | Alias JSON utilisé par le frontend Next.js (proxy sans CORS).【F:main.py†L2081-L2109】|

### API métier (`apps/api`)

L'API modulaire `apps/api` expose des routes CRUD sécurisées via les routeurs FastAPI :

- `/products`, `/products/{id}` et `/products/{id}/price-history` pour la gestion catalogue.【F:apps/api/app/routers/products.py†L105-L247】【F:apps/api/app/routers/products.py†L378-L479】
- `/offers` pour les offres marchand.【F:apps/api/app/routers/offers.py†L13-L173】
- `/suppliers` pour les partenaires et marchands.【F:apps/api/app/routers/suppliers.py†L11-L153】
- `/price-alerts` pour activer/mettre en pause des alertes avec Celery.【F:apps/api/app/routers/price_alerts.py†L13-L189】

Voir `docs/api_endpoints.md` pour la liste exhaustive.

## Variables d'environnement

Copiez `.env.example` à la racine vers `.env` ou `.env.local` (frontend) et adaptez :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | URL de l'API côté navigateur (ex : `http://localhost:8000`). |
| `API_BASE_URL` | URL de l'API côté serveur Next.js (proxy). |
| `NEXT_PUBLIC_APP_URL` / `APP_URL` / `VERCEL_URL` | URLs utilisées pour générer des liens (fallback vers `http://localhost:3000`).【F:frontend/src/lib/apiClient.ts†L80-L123】|
| `NEXT_PUBLIC_SITE_URL` | Base utilisée pour `sitemap.ts`.【F:frontend/src/app/sitemap.ts†L5-L13】|
| `NEXT_PUBLIC_IMAGE_PROXY_URL` / `IMAGE_PROXY_URL` | Cible de proxy pour forcer le HTTPS sur les visuels. 【F:frontend/src/lib/images.ts†L74-L114】|
| `SERPAPI_KEY` | Clé SerpAPI utilisée par l'agrégateur (`main.py`).【F:main.py†L26-L37】|
| `SCRAPER_BASE_URL` | URL du micro-service scraper (`http://localhost:8001` par défaut).【F:main.py†L31-L35】|
| `FORCE_IMAGE_HTTPS` | Forcer la réécriture HTTPS des images externes.【F:main.py†L39-L52】|
| `API_DATABASE_URL` | Chaîne PostgreSQL pour l'API métier. | 
| `API_CELERY_BROKER_URL` / `API_CELERY_RESULT_BACKEND` | Connexions Redis pour Celery. |
| `FITIDION_WEBHOOK_SECRET` | Signature des webhooks d'ingestion (à définir). |

## Qualité & vérifications

- **ESLint** : `npm run lint` (flat config `eslint.config.js` + config Next dans `frontend`).【F:package.json†L7-L15】
- **TypeScript** : `npm run build` vérifie les types Next.js via `next build --turbopack`.【F:frontend/package.json†L6-L10】
- **Tests backend** : `poetry run pytest` dans `apps/api` (tests HTTPX à compléter).【F:apps/api/pyproject.toml†L21-L26】
- **Scrapers** : `python -m services.gyms_scraper` pour valider la collecte Basic-Fit.【F:services/gyms_scraper.py†L1-L27】

## Mises à jour recommandées

- **Frontend** : supprimer les anciennes routes `src/pages/api` ou les migrer vers `app/api` pour éviter les doublons (`/app` vs `/pages`).【F:frontend/src/pages/api/comparatif.ts†L1-L200】【F:frontend/src/app/api/proxy/route.ts†L1-L43】
- **Packages Node racine** : l'ancien shell Vite (`package.json` à la racine) utilise React 18/Tailwind 3 ; envisager soit sa suppression, soit une mise à jour vers React 19/Tailwind 4 pour rester cohérent avec le frontend Next.js.【F:package.json†L11-L33】
- **Backend Python** : prévoir une montée de version (FastAPI ≥ 0.115, Uvicorn ≥ 0.32, SQLAlchemy ≥ 2.0.36) et ajouter des tests sur `/compare` et `/search`.【F:apps/api/pyproject.toml†L10-L26】
- **Prettier** : ajouter une configuration partagée (absente du dépôt) pour homogénéiser le formatage multi-projets.
- **Sécurité** : remplacer les valeurs par défaut (`SERPAPI_KEY`, secrets Celery) avant production et documenter la rotation.

---

Consultez `docs/SETUP.md` pour une procédure détaillée d'installation et `docs/ARCHITECTURE.md` pour la cartographie complète des flux Fitidion.
