# 🧬 Whey Comparator — Backend FastAPI

Ce dossier contient l'API qui alimente la plateforme FitIdion. Elle centralise les offres collectées (scraping, sources partenaires), calcule les historiques de prix et orchestre les workflows d'alertes consommés par le frontend Next.js et des intégrations tierces.

## 🗂️ Architecture du dossier

```
apps/api/
├── app/
│   ├── main.py              # Initialisation FastAPI + middlewares
│   ├── config.py            # Chargement des variables d'environnement (préfixe API_)
│   ├── database.py          # Session SQLAlchemy + gestion du moteur
│   ├── models.py            # Modèles ORM (Product, Supplier, Offer, PriceHistory, PriceAlert, ScrapeJob)
│   ├── schemas.py           # Schémas Pydantic v2 pour les payloads/retours
│   ├── routers/             # Routes REST (products, suppliers, offers, price_alerts)
│   ├── celery_app.py        # Configuration Celery (broker/result Redis)
│   ├── scheduler.py         # Gestionnaire de tâches planifiées (rafraîchissement scraping)
│   └── tasks.py             # Tâches d'ingestion & scraping simulé
├── alembic/                 # Scripts de migrations
├── alembic.ini              # Configuration Alembic
├── tests/                   # Jeux de tests Pytest + HTTPX
└── pyproject.toml           # Dépendances Poetry
```

## ⚙️ Fonctionnement

1. **Application FastAPI** : `app/main.py` installe CORS et monte les routeurs `products`, `suppliers`, `offers`, `price_alerts` ainsi que la route de healthcheck. Chaque endpoint renvoie des schémas Pydantic typés (pagination incluse).
2. **Accès base de données** : `database.py` expose `SessionLocal` et une dépendance `get_db` pour injecter une session SQLAlchemy dans les routes. Les modèles couvrent produits, fournisseurs, offres, historiques de prix et alertes.
3. **Migrations & data lifecycle** : Alembic gère la structure SQL. Les mises à jour CRUD se propagent via SQLAlchemy avec rafraîchissement automatique.
4. **Tâches asynchrones** : `celery_app.py` configure Celery (Redis). Le module `tasks.py` simule une exécution de scraping, alimente la table `scrape_jobs` et stocke les logs horodatés.
5. **Interopérabilité frontend** : les routes paginées et filtrables exposent les mêmes champs que consommés par l'App Router (résumés produits, offres filtrées, listes de marchands, historiques de prix et alertes actives).

## 📚 Bibliothèques principales

- **FastAPI 0.110** pour l'API REST et la documentation OpenAPI automatique.
- **SQLAlchemy 2.0** + **Pydantic v2** pour l'ORM et la validation.
- **Alembic** pour les migrations.
- **Celery 5** & **Redis 5** pour les traitements différés.
- **Uvicorn** (serveur ASGI) et **psycopg 3** (driver PostgreSQL).
- **python-dotenv / pydantic-settings** pour la configuration.

## ✨ Améliorations récentes

- Ajout de l'endpoint `GET /products/{id}/price-history` avec calcul automatique des statistiques (min/moyenne/tendance) pour les graphiques d'analyse de prix.
- Uniformisation des réponses paginées (`PaginatedProducts`, `PaginatedOffers`, `PaginatedSuppliers`, `PaginatedPriceAlerts`) pour le thème frontend et les intégrations tierces.
- Enregistrement des jobs de scraping simulés et des alertes prix afin d'alimenter la recherche unifiée et les sections monitoring du dashboard.

## 🔌 Endpoints phares

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/products` | Liste paginée avec filtres, ratio protéines/prix et meilleure offre associée. |
| `GET` | `/products/{id}` | Détail complet incluant nutrition, tags, offres attachées. |
| `GET` | `/products/{id}/price-history` | 30 points max + statistiques (`current`, `lowest`, `trend`). |
| `GET` | `/offers` | Filtrage multi-critères (prix, disponibilité, marchands). |
| `GET` | `/suppliers` | Référentiel marchands & URLs d'affiliation. |
| `POST` | `/price-alerts` | Création d'une alerte (email + seuil) synchronisée avec le worker Celery. |
| `PATCH` | `/price-alerts/{id}` | Activation/désactivation et mise à jour du seuil cible. |

Les payloads Pydantic sont disponibles dans `app/schemas.py`. Une vue d'ensemble (API d'orchestration + agrégation) est décrite dans `../../docs/api_endpoints.md`.

## 📦 Dépendances & installation

Le backend est géré via [Poetry](https://python-poetry.org/).

```bash
cd apps/api
poetry install
```

Un fichier `poetry.lock` est généré automatiquement. Les dépendances clés sont listées dans `pyproject.toml` (FastAPI, SQLAlchemy, Alembic, Celery, Redis, psycopg, pytest...).

## 🔐 Variables d'environnement

Les paramètres se chargent via `API_` (voir `config.py`). Exemple `.env` :

| Variable | Description | Valeur par défaut |
| --- | --- | --- |
| `API_DATABASE_URL` | Chaîne de connexion PostgreSQL/SQLAlchemy | `postgresql+psycopg://postgres:postgres@db:5432/whey` |
| `API_ALEMBIC_INI` | Chemin vers le fichier Alembic | `alembic.ini` |
| `API_CELERY_BROKER_URL` | Broker Celery (Redis recommandé) | `redis://redis:6379/0` |
| `API_CELERY_RESULT_BACKEND` | Backend de résultats Celery | `redis://redis:6379/0` |

Pour exécuter localement :

```bash
poetry run uvicorn app.main:app --reload
poetry run celery -A app.tasks.celery_app worker -l info
```

## 🛠️ Fonctionnement quotidien

- `GET /products` accepte les filtres `search`, `sort_by`, `sort_order`, `limit`, `offset`, `min_price`, `max_price`.
- `GET /offers` ajoute `product_id`, `supplier_id`, `available`, `currency`.
- `GET /suppliers` supporte la recherche texte (`name`, `website`).
- `GET /products/{id}/price-history` expose un historique consolidé pour alimenter les graphiques Recharts.
- `POST /price-alerts` et `PATCH /price-alerts/{id}` gèrent l'activation des notifications côté utilisateur.
- Toutes les routes CRUD sont documentées sur `/docs` (Swagger UI) une fois le serveur lancé.

## 🛣️ Roadmap backend

- [ ] Finaliser l'intégration réelle des scrapers (remplacer la simulation Celery).
- [ ] Ajouter des agrégations prix/volume (rapport protéine €/kg) pour la nouvelle UI analytique.
- [ ] Mettre en place l'authentification API key pour les partenaires.
- [ ] Couvrir les routes CRUD par des tests Pytest supplémentaires (cas d'erreurs, permissions futures).
- [ ] Automatiser les migrations dans le pipeline CI/CD.
