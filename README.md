# FitIdion — Plateforme du fitness intelligent

## Aperçu du projet
FitIdion est la nouvelle version de Whey Comparator. La plateforme rassemble un comparateur de prix Next.js, une API FastAPI et une bibliothèque de données communes pour aider les sportifs à identifier les meilleurs compléments, équipements et abonnements. L'expérience utilisateur repose sur un design system Tailwind moderne, un mode sombre natif et des sections éditoriales mettant en avant les partenaires FitIdion.

Parmi les fonctionnalités clés :
- Comparateur intelligent avec agrégation multi-marchands, scoring nutritionnel et repérage automatique du meilleur prix.
- Catalogue produit enrichi avec filtres avancés, alertes e-mail et historique de prix visualisé sur les fiches produits.
- Moteur de recherche unifié couvrant produits, salles et programmes d'entraînement.
- Gym Locator connecté (scraping Basic-Fit et partenaires) pour trouver rapidement une salle proche.
- Documentation technique et produit centralisée (`docs/`).

## Stack technique
- **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS 4, TanStack Query et composants animés Framer Motion.
- **Backend** : FastAPI (API légère `main.py`) et projet complet `apps/api` (SQLAlchemy, Celery, APScheduler) pour l’ingestion et les alertes.
- **Données & services** : SerpAPI, scrapers Python (`services/gyms_scraper.py`), catalogue de secours (`fallback_catalogue.py`, `data/programmes.json`).
- **Outillage** : TypeScript 5, ESLint 9, Docker Compose, Poetry (backend) et PNPM/NPM pour le frontend.

## Installation locale
### 1. Démarrer toute la stack avec Docker (recommandé)
```bash
git clone https://github.com/<votre-organisation>/fitidion.git
cd fitidion
docker compose up --build
```
- Frontend Next.js : http://localhost:3000
- API FastAPI : http://localhost:8000 (Swagger disponible sur `/docs`).

Pour arrêter et nettoyer :
```bash
docker compose down
# Purge des volumes si nécessaire
docker compose down -v
```

### 2. Lancer les services manuellement
#### Frontend Next.js
```bash
# Installer les dépendances
npm install --prefix frontend

# Lancer le serveur de développement
npm run dev --prefix frontend
```
Le site est disponible sur http://localhost:3000.

#### API FastAPI légère (`main.py`)
```bash
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Variables utiles : `SERPAPI_KEY`, `SCRAPER_BASE_URL`.

#### Backend complet (`apps/api`)
```bash
cd apps/api
poetry install
poetry run uvicorn app.main:app --reload --port 8100
```
Lancer les workers Celery : `poetry run celery -A app.celery_app worker -l info` et le scheduler : `poetry run python -m app.scheduler`.

## Déploiement
- **Frontend** : compatible Vercel/Netlify. Exposer les variables `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `SERPAPI_KEY`.
- **API FastAPI** : hébergement sur Fly.io, Render ou un conteneur Docker (voir `Dockerfile` et `docker-compose.yml`). Prévoir PostgreSQL et Redis pour la stack complète (`apps/api`).
- **Workers & scraping** : exécuter `services/gyms_scraper.py` et les tâches Celery via un orchestrateur (Docker Compose, Kubernetes ou services managés).

## Structure des répertoires
```
.
├── README.md                     # Ce guide
├── frontend/                     # Application Next.js (App Router)
│   ├── src/app/                  # Pages, layouts, API routes app/
│   ├── src/components/           # Composants UI et sections marketing
│   ├── src/lib/                  # Clients API, metadata, helpers
│   └── public/                   # Assets (logos, manifest, captures)
├── apps/
│   └── api/                      # Backend FastAPI complet (Poetry)
├── services/                     # Scripts de scraping & ingestion Python
├── data/                         # Données statiques partagées
├── docs/                         # Documentation produit & technique
├── main.py / requirements.txt    # API FastAPI légère
├── docker-compose.yml            # Orchestration locale (Postgres, Redis, API, Frontend)
└── fallback_catalogue.py         # Catalogue de secours partagé
```

## Captures ou GIF de démonstration
- ![Interface FitIdion](frontend/public/FitIdion_Banner.png)
- ![Dashboard lumineux](frontend/public/FitIdionLogo_Light.png)

> Ajoutez vos propres captures (PNG ou GIF) dans `frontend/public/images/` pour illustrer des parcours spécifiques.
