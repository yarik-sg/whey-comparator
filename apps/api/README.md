# 🧬 Whey Comparator — Backend FastAPI

Ce dossier contient l'API qui alimente le comparateur de compléments alimentaires. Elle centralise les offres collectées (scraping, sources partenaires) et expose des routes REST pour le frontend Next.js ainsi que pour des intégrations tierces.

## 🗂️ Architecture du dossier

```
apps/api/
├── app/
│   ├── main.py              # Initialisation FastAPI + middlewares
│   ├── config.py            # Chargement des variables d'environnement (préfixe API_)
│   ├── database.py          # Session SQLAlchemy + gestion du moteur
│   ├── models.py            # Modèles ORM (Product, Supplier, Offer, ScrapeJob)
│   ├── schemas.py           # Schémas Pydantic v2 pour les payloads/retours
│   ├── routers/             # Routes REST (products, suppliers, offers)
│   ├── celery_app.py        # Configuration Celery (broker/result Redis)
│   └── tasks.py             # Tâches d'ingestion & scraping simulé
├── alembic/                 # Scripts de migrations
├── alembic.ini              # Configuration Alembic
├── tests/                   # Jeux de tests Pytest + HTTPX
└── pyproject.toml           # Dépendances Poetry
```

## ⚙️ Fonctionnement

1. **Application FastAPI** : `app/main.py` installe CORS et monte les routeurs `products`, `suppliers`, `offers` et la route de healthcheck. Chaque route renvoie des schémas Pydantic typés (pagination incluse).
2. **Accès base de données** : `database.py` expose `SessionLocal` et une dépendance `get_db` pour injecter une session SQLAlchemy dans les routes. Les modèles couvrent produits, fournisseurs, offres et historiques de scraping.
3. **Migrations & data lifecycle** : Alembic gère la structure SQL. Les mises à jour CRUD se propagent via SQLAlchemy avec rafraîchissement automatique.
4. **Tâches asynchrones** : `celery_app.py` configure Celery (Redis). Le module `tasks.py` simule une exécution de scraping, alimente la table `scrape_jobs` et stocke les logs horodatés.
5. **Interopérabilité frontend** : les routes paginées et filtrables exposent les mêmes champs que consommés par l'App Router (résumés produits, offres filtrées, listes de marchands).

## 📚 Bibliothèques principales

- **FastAPI 0.110** pour l'API REST et la documentation OpenAPI automatique.
- **SQLAlchemy 2.0** + **Pydantic v2** pour l'ORM et la validation.
- **Alembic** pour les migrations.
- **Celery 5** & **Redis 5** pour les traitements différés.
- **Uvicorn** (serveur ASGI) et **psycopg 3** (driver PostgreSQL).
- **python-dotenv / pydantic-settings** pour la configuration.

## ✨ Améliorations récentes

- Exposition d'une pagination homogène (`PaginatedProducts`, `PaginatedOffers`, `PaginatedSuppliers`) consommée par le nouveau thème frontend.
- Ajout des routes `offers` et `suppliers` avec filtres multi-critères pour alimenter les nouvelles sections comparateur & partenaires.
- Enregistrement des jobs de scraping simulés pour accompagner la refonte UI (vignettes d'activité, logs).

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

- `GET /products` accepte filtres `search`, `sort_by`, `sort_order`, `limit`, `offset`.
- `GET /offers` ajoute `product_id`, `supplier_id`, `min_price`, `max_price`, `available`.
- `GET /suppliers` supporte la recherche texte (`name`, `website`).
- CRUD complet pour chaque ressource + `GET /health`.

Consultez `/docs` (Swagger UI) une fois le serveur lancé.

## 🛣️ Roadmap backend

- [ ] Finaliser l'intégration réelle des scrapers (remplacer la simulation Celery).
- [ ] Ajouter des agrégations prix/volume (rapport protéine €/kg) pour la nouvelle UI analytique.
- [ ] Mettre en place l'authentification API key pour les partenaires.
- [ ] Couvrir les routes CRUD par des tests Pytest supplémentaires (cas d'erreurs, permissions futures).
- [ ] Automatiser les migrations dans le pipeline CI/CD.
