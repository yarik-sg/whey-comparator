# ⚡️ FitIdion — La plateforme du fitness intelligent

FitIdion est la nouvelle identité de Whey Comparator. La plateforme combine une API de collecte de prix,
un comparateur Next.js 15 (React 19) basé sur l’architecture `app/` et une documentation produit unifiée pour aider les sportifs à
identifier les meilleures offres de compléments, équipements et abonnements. L'expérience a été
rethinkée pour refléter le langage visuel FitIdion : palette orange & or, typographie Poppins et
interfaces lumineuses/dynamiques avec bascule automatique clair/sombre.

## ✨ Points forts

- **Catalogue enrichi FitIdion** : agrégation multi-marchands, scores nutritionnels et filtres intelligents
  (marque, forme, rapport protéines/prix) avec fallback local lorsque le scraping échoue.
- **Comparateur en temps réel** : juxtaposition de produits, surlignage automatique du meilleur deal et
  historique des prix synchronisé avec les alertes.
- **Analyse d'historique des prix** : collecte quotidienne (PostgreSQL + fallback) avec statistiques
  auto-calculées (min/moyenne/tendance) et visualisation Recharts sur les fiches produit.
- **Alertes FitIdion** : interface dédiée pour activer/mettre en pause les notifications de baisse de prix
  avec onboarding simplifié et suivi par e-mail.
- **Dashboard visuel** : sections « Pourquoi FitIdion », « Gym Locator » et « Insights » aux cartes vitrées,
  gradients FitIdion et ombres douces pour un rendu premium.
- **Système de design unifié** : Tailwind CSS 4, composants boutons/inputs/checkbox/slider optimisés pour
  la palette FitIdion et un ThemeProvider maison avec stockage local du mode sombre.
- **Programmes dynamiques** : page `/programmes` connectée à l'API (JSON partagé) et intégrée à la recherche
  globale pour orienter les utilisateurs vers les routines adaptées.
- **Gym Locator connecté** : scraping Basic-Fit temps réel via `services/gyms_scraper.py` pour alimenter la
  page salles avec des liens marchands officiels.
- **Recherche unifiée FitIdion** : endpoint `/search` combinant catalogue, gyms et programmes pour proposer
  des résultats multi-verticales depuis une seule barre.

## 🧱 Stack technique

- **Frontend** : Next.js 15 (architecture `app/`, composants serveur et client) avec Tailwind CSS 4 pour le
  design system FitIdion.
- **Backend** : FastAPI (Python) via l’API légère (`main.py`) et le projet complet `apps/api` (SQLAlchemy,
  Celery, APScheduler).
- **Intégrations** : SerpAPI pour l’agrégation prix, APIs/scrapers de salles de sport (`services/gyms_scraper.py`)
  et données locales de secours (`fallback_catalogue.py`, `data/programmes.json`).

## 🔌 API & données exposées

FitIdion met à disposition une API publique accessible en local sur `http://localhost:8000` :

- `GET /products/{id}/price-history` — agrégation des 30 derniers relevés avec statistiques (min/moyenne/
  tendance) consommée par les graphiques Recharts.
- `GET /programmes` — JSON structuré (`data/programmes.json`) partagé entre le frontend et la recherche
  unifiée pour afficher les routines dynamiques.
- `GET /gyms` — données Basic-Fit/partenaires actualisées via `services/gyms_scraper.py` avec fallback
  catalogue.
- `GET /search` — recherche instantanée (produits, gyms, programmes) avec pondération sur la pertinence.
- `POST /price-alerts` — enregistrement et activation des alertes (workflow géré par Celery/Redis).

La liste exhaustive des routes (CRUD FastAPI + agrégation) est détaillée dans `docs/api_endpoints.md`.

## 🏗️ Cartographie du dépôt

```
whey-comparator/
├── README.md                        # Vue d'ensemble FitIdion + démarrage rapide
├── docs/                            # Documentation produit & technique
│   ├── architecture.md              # Schéma détaillé des couches (frontend, API, services)
│   ├── api_endpoints.md             # Référence des routes FastAPI & agrégation
│   ├── design_guidelines.md         # Charte graphique & tokens Tailwind
│   ├── features.md                  # Parcours et modules principaux
│   ├── next_steps.md                # Roadmap produit & technique
│   └── recommandations-ameliorees.md# Recommandations stratégiques
├── data/
│   └── programmes.json              # Référentiel des programmes sportifs (endpoint `/programmes`)
├── apps/
│   └── api/                         # Backend FastAPI (Poetry)
│       ├── README.md                # Guide d'exploitation backend
│       ├── app/
│       │   ├── main.py              # Point d'entrée FastAPI + montage des routeurs
│       │   ├── config.py            # Paramètres Pydantic (`API_*`)
│       │   ├── database.py          # Session SQLAlchemy & dépendances FastAPI
│       │   ├── models.py            # ORM (Product, Offer, Supplier, PriceHistory, PriceAlert…)
│       │   ├── schemas.py           # Schémas Pydantic v2 (payloads & réponses)
│       │   ├── routers/             # Routes REST modulaires (products, offers, suppliers, price_alerts)
│       │   ├── celery_app.py        # Configuration Celery/Redis
│       │   ├── tasks.py             # Tâches d’ingestion & notifications
│       │   ├── scheduler.py         # Planification de rafraîchissement (APScheduler)
│       │   └── email.py             # Templates d’alertes et envoi via SMTP/API
│       ├── alembic/                 # Migrations base de données
│       ├── tests/                   # Suite Pytest + HTTPX (produits, offres, alertes)
│       └── pyproject.toml           # Dépendances Poetry (FastAPI, SQLAlchemy, Celery…)
├── frontend/                        # Application Next.js 15 (React 19)
│   ├── README.md                    # Guide frontend + structure App Router
│   ├── next.config.ts               # Configuration Next.js (App Router, images, headers)
│   ├── tailwind.config.ts           # Config Tailwind spécifique frontend
│   ├── src/
│   │   ├── app/                     # Pages App Router (`page.tsx`, `/catalogue`, `/comparison`, `/alerts`…)
│   │   ├── components/              # Sections métier (HeroSection, PriceComparison…) & primitives UI
│   │   ├── data/                    # Données statiques (catégories populaires)
│   │   ├── hooks/                   # Hooks maison (ex : `useGyms`)
│   │   ├── lib/                     # Clients API, queries TanStack, catalogue fallback partagé
│   │   ├── styles/                  # Utilitaires CSS additionnels
│   │   └── types/                   # Types TypeScript pour les réponses API
│   ├── public/                      # Assets (logos, manifest, favicon placeholders)
│   └── vendor/                      # Bundles TanStack vendored (query-core & react-query)
├── services/
│   ├── gyms_scraper.py              # Scraper Basic-Fit pour `/gyms`
│   └── scraper/                     # Micro-service Python (collecte prix) + package Poetry
├── main.py                          # API FastAPI légère (agrégation temps réel)
├── fallback_catalogue.py            # Catalogue de secours partagé
├── docker-compose.yml               # Orchestration locale (Postgres, Redis, API, Frontend)
├── tailwind.config.ts               # Tokens partagés (design FitIdion)
├── package.json / package-lock.json # Scripts racine (proxy vers le frontend Next.js)
└── requirements.txt                 # Dépendances Python pour l’API légère
```

> 💡 Pour une description exhaustive de chaque répertoire, consultez `docs/architecture.md`.

## 🚀 Démarrage rapide

### Option 1 — Docker Compose (recommandé)

1. Installer Docker + Docker Compose.
2. Lancer la stack complète :

   ```bash
   docker compose up --build
   ```

   Cette commande provisionne Postgres, Redis, l'API FastAPI, le worker Celery et le frontend Next.js
   FitIdion (Turbopack). Les volumes conservent base de données et dépendances.

3. Accéder aux services :
   - Frontend FitIdion : [http://localhost:3000](http://localhost:3000)
   - API agrégation : [http://localhost:8000](http://localhost:8000) (`/docs` pour Swagger)

4. Arrêt / reset :

   ```bash
   docker compose down
   docker compose down -v  # purge volumes
   ```

Les variables (`API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, etc.) sont injectées automatiquement par
`docker-compose.yml` pour relier le frontend FitIdion à l'API.

### Option 2 — Lancer les services manuellement

#### API FastAPI

```bash
python -m venv .venv
source .venv/bin/activate  # Windows : .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Variables utiles :

- `SERPAPI_KEY` : clé SerpAPI (valeur de dev fournie).
- `SCRAPER_BASE_URL` : URL du service scraper (`http://localhost:8001` par défaut).

#### Backend complet (apps/api)

```bash
cd apps/api
poetry install
poetry run uvicorn app.main:app --reload
```

#### Frontend FitIdion (Next.js 15)

```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Le thème FitIdion est injecté globalement (gradients, mode sombre, typographie Poppins). Pour lier le
backend conteneurisé, utilisez `API_BASE_URL=http://api:8000`.

### Scripts utiles

| Commande                         | Description                                                    |
|---------------------------------|----------------------------------------------------------------|
| `docker compose up --build`     | Démarre la stack complète FitIdion.                            |
| `docker compose logs -f api`    | Suit les logs FastAPI.                                         |
| `npm run lint`                  | Exécute ESLint du frontend Next.js.                            |
| `npm run build`                 | Build production du frontend FitIdion (Next.js).               |
| `uvicorn main:app --reload`     | API FastAPI standalone avec rechargement.                      |

## 📘 Documentation FitIdion

Les dossiers `docs/` et `frontend/public/README_Branding.txt` détaillent :

- la charte FitIdion (palette, typographies, composants UI),
- le parcours utilisateur (comparateur, alertes, catalogue),
- la roadmap produit et les intégrations prévues (nouveaux marchands, IA pricing),
- les guidelines éditoriales (ton FitIdion, voix de marque).

## 🧪 Qualité & tests

- **ESLint / TypeScript** : `npm run lint` au niveau racine ou dans `frontend/` utilise la configuration
  Next.js (App Router) et les règles TypeScript partagées.
- **Tests API** : `pytest` dans `apps/api/tests` (exemples fournis pour la couche FastAPI).
- **CI/CD** : workflows à compléter (lint + tests) avant déploiement automatique.
- **Scraping gyms** : `python -m services.gyms_scraper` pour valider la collecte Basic-Fit et détecter les
  changements de markup.

---

✨ *FitIdion — Augmentez votre impact sportif avec des décisions guidées par la donnée.*
