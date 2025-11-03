# Guide d'installation — Fitidion

Ce document détaille la configuration locale complète de la plateforme Fitidion (frontend Next.js, API d'agrégation et API métier).

## 1. Prérequis

| Outil | Version recommandée |
|-------|---------------------|
| Node.js | ≥ 20.x |
| npm | ≥ 10.x |
| Python | ≥ 3.12 |
| Poetry | ≥ 1.6 |
| Docker / Docker Compose | Dernière version stable (optionnel mais recommandé) |
| PostgreSQL | ≥ 15 (installé localement ou via Docker) |
| Redis | ≥ 7 |

Clônez ensuite le dépôt et placez-vous à la racine :

```bash
git clone https://github.com/yarik-sg/whey-comparator.git
cd whey-comparator
```

## 2. Variables d'environnement

Copiez le fichier `.env.example` à la racine vers un fichier `.env` (utilisé par Docker) et/ou vers `frontend/.env.local` si vous lancez Next.js manuellement :

```bash
cp .env.example .env
cp .env.example frontend/.env.local
```

Ajustez au minimum :

- `NEXT_PUBLIC_API_BASE_URL` et `API_BASE_URL` vers l'URL de l'API FastAPI (par défaut `http://localhost:8000`).
- `API_DATABASE_URL`, `API_CELERY_BROKER_URL` et `API_CELERY_RESULT_BACKEND` avec vos instances PostgreSQL/Redis.
- `SERPAPI_KEY` si vous possédez une clé personnelle (une valeur de test est fournie).

## 3. Lancer la stack via Docker Compose (recommandé)

```bash
docker compose up --build
```

Services exposés :

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | Next.js 15 avec App Router et proxy interne (`/api/proxy`).【F:docker-compose.yml†L52-L76】|
| api | 8000 | FastAPI + PostgreSQL via SQLAlchemy (apps/api).【F:docker-compose.yml†L21-L50】|
| worker | n/a | Worker Celery pour les alertes prix.【F:docker-compose.yml†L38-L50】|
| db | 5432 | PostgreSQL 15 initialisé avec la base `whey`.【F:docker-compose.yml†L4-L18】|
| redis | 6379 | Broker/Backend Celery. 【F:docker-compose.yml†L18-L20】|

Le frontend attend l'API sur `http://api:8000` côté serveur et `http://localhost:8000` côté navigateur (variables injectées dans `docker-compose.yml`). Les volumes montés (`frontend_node_modules`, `frontend_next`) préservent la cache Next.js entre les redémarrages.【F:docker-compose.yml†L60-L76】

Pour arrêter la stack : `docker compose down`. Ajoutez `-v` pour supprimer les volumes (données PostgreSQL inclues).

## 4. Installation manuelle des services

### 4.1 API d'agrégation (`main.py`)

1. Créez un environnement virtuel Python :

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows : .venv\Scripts\activate
   ```

2. Installez les dépendances FastAPI légères :

   ```bash
   pip install -r requirements.txt
   ```

3. Démarrez le serveur :

   ```bash
   uvicorn main:app --reload
   ```

   - L'API répond sur `http://localhost:8000`.
   - Le endpoint `/` renvoie un message de santé, `/products` agrège les produits et `/api/gyms` fournit les salles de sport.【F:main.py†L2506-L3056】【F:main.py†L2081-L2109】

4. (Optionnel) Activez la réécriture HTTPS des images avec `FORCE_IMAGE_HTTPS=true` pour harmoniser l'affichage frontend.【F:main.py†L39-L52】

### 4.2 API métier (`apps/api`)

1. Installez les dépendances avec Poetry :

   ```bash
   cd apps/api
   poetry install
   ```

2. Configurez la base PostgreSQL via `API_DATABASE_URL` (voir `.env.example`). Les migrations sont gérées par Alembic :

   ```bash
   poetry run alembic upgrade head
   ```

3. Démarrez l'API :

   ```bash
   poetry run uvicorn app.main:app --reload
   ```

4. Lancez le worker Celery pour les alertes :

   ```bash
   poetry run celery -A app.tasks worker --loglevel=INFO
   ```

5. (Optionnel) Exécutez la suite de tests Pytest :

   ```bash
   poetry run pytest
   ```

   Les tests utilisent HTTPX et couvrent produits/offres/alertes (à compléter selon vos besoins).【F:apps/api/pyproject.toml†L10-L26】

### 4.3 Frontend Next.js 15 (`frontend/`)

1. Installez les dépendances :

   ```bash
   cd frontend
   npm install
   ```

2. Vérifiez que `.env.local` contient les valeurs nécessaires (`NEXT_PUBLIC_API_BASE_URL`, `API_BASE_URL`, `NEXT_PUBLIC_IMAGE_PROXY_URL`, etc.). Les helpers `apiClient` et `images.ts` résolvent automatiquement les URLs selon l'environnement.【F:frontend/src/lib/apiClient.ts†L80-L123】【F:frontend/src/lib/images.ts†L74-L114】

3. Démarrez le serveur de développement :

   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```

4. Build & lint :

   ```bash
   npm run lint
   npm run build
   ```

   `npm run lint` applique la configuration ESLint flat (`eslint.config.js`) tandis que `npm run build` s'appuie sur `next build --turbopack` pour valider les types et générer la production.【F:package.json†L7-L15】【F:frontend/package.json†L6-L10】

### 4.4 Services complémentaires

- **Scraper Basic-Fit** : `python -m services.gyms_scraper` retourne la liste des salles et peut alimenter un cache local.【F:services/gyms_scraper.py†L1-L27】
- **Catalogue fallback** : `fallback_catalogue.py` expose des helpers pour récupérer des produits/offres de secours lorsque le scraping échoue.【F:fallback_catalogue.py†L1-L104】

## 5. Vérifications rapides après installation

1. Ouvrez <http://localhost:3000> et vérifiez la page catalogue (`/catalogue`) : les cartes produits doivent se charger via le proxy Next (`/api/proxy?target=products`).【F:frontend/src/app/catalogue/page.tsx†L267-L338】
2. Testez l'API d'agrégation :
   - `curl http://localhost:8000/products` → liste paginée avec métadonnées `page`, `perPage`, `total`.【F:main.py†L2506-L2607】
   - `curl http://localhost:8000/api/gyms` → JSON de salles Basic-Fit/mock.【F:main.py†L2081-L2109】
3. Vérifiez l'API métier via Swagger (`http://localhost:8000/docs` si vous exposez `apps/api`) ou via `poetry run pytest`.
4. Confirmez que les variables d'environnement sont bien appliquées en examinant les en-têtes `X-Fitidion-Request` lors des appels proxifiés (ajout futur).

## 6. Dépannage courant

| Problème | Solution |
|----------|----------|
| Erreur CORS lors des appels frontend → API | Vérifiez `API_BASE_URL`/`NEXT_PUBLIC_API_BASE_URL` et la configuration CORS de `main.py` (origins `*` en dev).【F:main.py†L17-L25】|
| `503` sur `/products` | Le scraper externe est indisponible : l'API retombe sur `fallback_catalogue.py`, assurez-vous que le fichier est accessible et que le service répond (`SCRAPER_BASE_URL`).【F:main.py†L1035-L1179】|
| Next.js répond avec `ECONNREFUSED` | L'API n'est pas démarrée ou `API_BASE_URL` est erroné. Vérifiez également que `/api/proxy` renvoie bien un JSON (statut 200).【F:frontend/src/app/api/proxy/route.ts†L1-L43】|
| Erreurs `psycopg` au démarrage | Assurez-vous que PostgreSQL écoute sur `API_DATABASE_URL` et que les migrations ont été appliquées (`alembic upgrade head`). |
| Worker Celery inactif | Démarrez `docker compose up worker` ou la commande Poetry dédiée ; sans worker, les alertes prix restent en file. |

---

Vous pouvez maintenant reprendre le développement de Fitidion avec une stack alignée sur Next.js 15 / React 19 et deux couches FastAPI prêtes pour la production.
