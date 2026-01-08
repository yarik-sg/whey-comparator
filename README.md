# FitIdion — Comparez, progressez, performez dans le fitness

## Aperçu du projet
FitIdion est la nouvelle version de Whey Comparator. La plateforme rassemble un comparateur de prix Next.js, une API FastAPI et une bibliothèque de données communes pour aider les sportifs à identifier les meilleurs compléments, équipements et abonnements. L'expérience utilisateur repose sur un design system Tailwind moderne, un mode sombre natif et des parcours guidés couvrant toutes les routes clés : produits, salles, programmes, favoris et tableau de bord.

Parmi les fonctionnalités clés :
- Comparateur intelligent avec agrégation multi-marchands, scoring nutritionnel et repérage automatique du meilleur prix.
- Catalogue produit enrichi avec filtres avancés, alertes e-mail et historique de prix visualisé sur les fiches produits.
- Moteur de recherche unifié couvrant produits, salles et programmes d'entraînement.
- Gym Locator connecté (scraping Basic-Fit et partenaires) pour trouver rapidement une salle proche.
- Centre légal unifié avec mentions légales, politique de confidentialité et gestion des cookies.
- Documentation technique et produit centralisée (`docs/`).

## Aperçu du design final
- ![Hero FitIdion](frontend/public/FitIdion_Banner.png)
- ![Catalogue produits](frontend/public/images/prise-masse.jpg)
- ![Programme d'entraînement](frontend/public/images/seche-musculaire.jpg)

## Stack technique
- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS 4, TanStack Query et composants animés Framer Motion.
- **Backend principal** : FastAPI (`main.py` à la racine) — API d'agrégation combinant SerpAPI, scrapers et fallback pour alimenter le frontend.
- **Backend avancé (optionnel)** : `apps/api` (SQLAlchemy, Celery, APScheduler) pour l'ingestion persistante et les alertes planifiées.
- **Données & services** : SerpAPI, scrapers Python (`services/gyms_scraper.py`), catalogue de secours (`fallback_catalogue.py`, `data/programmes.json`).
- **Outillage** : TypeScript 5, ESLint 9, Docker Compose, Poetry (backend avancé) et PNPM/NPM pour le frontend.

## Installation locale
### Prérequis
- Node.js ≥ 20 et npm 10 (ou PNPM 9 si vous préférez).
- Python 3.11+ pour l'API FastAPI.
- Docker 24+ et Docker Compose si vous lancez toute la stack en conteneurs.
- Poetry 1.8 (optionnel, uniquement pour le backend avancé `apps/api`).

### Option A — Stack complète avec Docker
```bash
git clone https://github.com/<votre-organisation>/fitidion.git
cd fitidion
docker compose up --build
```
- Frontend Next.js : http://localhost:3000
- API FastAPI légère : http://localhost:8000 (Swagger sur `/docs`)

Arrêt et nettoyage :
```bash
docker compose down
# Purge des volumes si nécessaire
docker compose down -v
```

### Option B — Installation manuelle
#### 1. Frontend Next.js
```bash
npm install --prefix frontend
```
Créez le fichier `frontend/.env.local` s'il n'existe pas puis définissez :
Variables essentielles dans `frontend/.env.local` :
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Démarrer le serveur :
```bash
npm run dev --prefix frontend
```

Vérifiez les parcours `/products`, `/gyms`, `/programmes`, `/favoris`, `/dashboard` directement dans le navigateur.

#### 2. Backend FastAPI (`main.py` — racine du projet)
```bash
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Variables d'environnement :
- `SERPAPI_KEY` : clé API SerpAPI pour les recherches produits.
- `SCRAPER_BASE_URL` : URL du scraper externe (optionnel).
- `API_CACHE_TTL_SECONDS` : durée du cache en secondes (défaut : 120).

Swagger UI disponible sur http://localhost:8000/docs.

#### 3. Backend avancé (optionnel) — `apps/api`
Ce backend fournit une persistance PostgreSQL, des workers Celery et des alertes planifiées :
```bash
cd apps/api
poetry install
poetry run uvicorn app.main:app --reload --port 8100
```
Workers Celery :
```bash
poetry run celery -A app.celery_app worker -l info
poetry run python -m app.scheduler
```

> ⚠️ Pour un déploiement simple (Vercel + Render), le backend principal (`main.py`) suffit.

## Déploiement
### Frontend (Vercel)
1. Lancer un build local pour valider :
   ```bash
   npm run build --prefix frontend
   ```
2. Configurer les variables d'environnement :
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `SERPAPI_KEY` (si l'intégration d'alertes prix est active)
3. Commande de build : `npm run build --prefix frontend`
4. Commande de démarrage : `npm run start --prefix frontend`

### Frontend (Render ou autre PaaS)
- Image Node 20.
- Build command : `npm install --prefix frontend && npm run build --prefix frontend`.
- Start command : `npm run start --prefix frontend` (pensez à définir `PORT`).
- Activer la mise en cache du dossier `frontend/.next` pour des déploiements plus rapides.

### Backend FastAPI (Render)
Le fichier `render.yaml` à la racine configure le déploiement automatique :
```yaml
services:
  - type: web
    name: fitidion-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variables d'environnement à configurer dans Render :
- `SERPAPI_KEY` (secret) : clé API SerpAPI.
- `SCRAPER_BASE_URL` (optionnel) : URL du scraper externe.
- `API_CACHE_TTL_SECONDS` : durée du cache (défaut : 120).
- `FORCE_IMAGE_HTTPS` : forcer HTTPS pour les images (défaut : true).

> Pour le backend avancé (`apps/api`) avec PostgreSQL/Redis, provisionner les services additionnels.

### Workers & scraping
- `services/gyms_scraper.py` peut être orchestré via Cron, Celery Beat ou un scheduler Render.
- Les workers Celery décrits plus haut doivent partager les mêmes variables que l'API.

> Consultez `docs/build-report.md` pour le détail du dernier build et des vérifications de déploiement.

## Structure des répertoires
```
.
├── README.md                     # Ce guide
├── main.py                       # 🚀 Backend FastAPI principal (point d'entrée)
├── requirements.txt              # Dépendances Python du backend
├── fallback_catalogue.py         # Catalogue de secours partagé
├── render.yaml                   # Configuration déploiement Render
├── docker-compose.yml            # Orchestration locale (Postgres, Redis, API, Frontend)
├── frontend/                     # Application Next.js (App Router)
│   ├── src/app/                  # Pages, layouts, API routes
│   ├── src/components/           # Composants UI et sections marketing
│   ├── src/lib/                  # Clients API, metadata, helpers
│   ├── vercel.json               # Configuration déploiement Vercel
│   └── public/                   # Assets (logos, manifest, captures)
├── apps/
│   └── api/                      # Backend avancé (Poetry, SQLAlchemy, Celery)
├── services/                     # Scripts de scraping & ingestion Python
├── data/                         # Données statiques partagées (programmes, gyms)
└── docs/                         # Documentation produit & technique
```

