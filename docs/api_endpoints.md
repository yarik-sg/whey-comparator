# FitIdion API — Référence des endpoints

La plateforme expose deux couches complémentaires :

1. **API d'orchestration (`apps/api/app`)** pour la gestion CRUD des produits, offres, marchands et alertes prix.
2. **API d'agrégation (`main.py`)** qui combine scrapers, caches et fallback pour alimenter le frontend Next.js et les intégrations externes.

Toutes les routes sont servies depuis `http://localhost:8000` en développement (voir `docker-compose.yml`).

## 1. API d'orchestration — `apps/api/app`

| Ressource | Fichier | Routes | Notes |
|-----------|---------|--------|-------|
| Healthcheck | `app/main.py` | `GET /health` | Retour `{ "status": "ok" }`. |
| Produits | `app/routers/products.py` | `GET /products`, `POST /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}` | Champs nutritionnels, tags, meilleure offre, timestamps. |
| Historique de prix | `app/routers/products.py` | `GET /products/{id}/price-history` | 30 relevés max + stats (`current`, `lowest`, `highest`, `trend`). |
| Offres | `app/routers/offers.py` | `GET /offers`, `POST /offers`, `GET /offers/{id}`, `PUT /offers/{id}`, `DELETE /offers/{id}` | Filtres prix, disponibilité, marchands, devise. |
| Fournisseurs | `app/routers/suppliers.py` | `GET /suppliers`, `POST /suppliers`, `GET /suppliers/{id}`, `PUT /suppliers/{id}`, `DELETE /suppliers/{id}` | Gestion des marchands et URLs d’affiliation. |
| Alertes prix | `app/routers/price_alerts.py` | `GET /price-alerts`, `POST /price-alerts`, `PATCH /price-alerts/{id}`, `DELETE /price-alerts/{id}` | Activation/désactivation, seuils personnalisés, statut. |

Les schémas Pydantic utilisés par ces routes sont définis dans `apps/api/app/schemas.py`. Les listes suivent une enveloppe standard :

```json
{
  "total": 120,
  "items": [ ... ],
  "limit": 10,
  "offset": 0
}
```

### Paramètres communs

- `limit` *(1-100, défaut 10)* et `offset` *(≥0)* pour la pagination.
- `search` sur les champs textuels (`name`, `brand`, `supplier`).
- `sort_by` + `sort_order` (`asc`/`desc`).
- Filtres spécifiques (`available`, `min_price`, `max_price`, `supplier_id`, `category`, etc.).

### Traitements asynchrones

- `app/tasks.py` gère l’ingestion (scraping simulé, synchronisation d’offres) et le traitement des alertes.
- `app/email.py` envoie les notifications suite aux alertes déclenchées.
- `app/scheduler.py` (APScheduler) planifie les rafraîchissements périodiques.

## 2. API d'agrégation FitIdion — `main.py`

Cette API combine :

- Résultats SerpAPI + scrapers internes (`services/scraper`).
- Enrichissement FitIdion (ratio protéines/prix, notation, disponibilité temps réel).
- Fallback catalogue (`fallback_catalogue.py`) pour la résilience offline.
- Scraper gyms (`services/gyms_scraper.py`).

### Catalogue enrichi — `GET /products`

Paramètres : `search`, `page` (défaut 1), `per_page` (1-60), `min_price`, `max_price`, `brands[]`, `category`, `in_stock`, `sort` (`price_asc`, `price_desc`, `rating`, `protein_ratio`).

Réponse :

```json
{
  "products": [ProductCard],
  "page": 1,
  "perPage": 24,
  "total": 240,
  "totalPages": 10,
  "hasPrevious": false,
  "hasNext": true
}
```

### Détail produit (agrégation)

- `GET /products/{productId}/offers` — Offre principale + offres alternatives (structure `{ product, offers, sources }`).
- `GET /products/{productId}/similar` — Suggestions par marque/catégorie.
- `GET /products/{productId}/related` — Produits complémentaires.
- `GET /products/{productId}/price-history` — Historique agrégé (points + statistiques).
- `GET /products/{productId}/reviews` — Synthèse avis (moyenne, distribution, highlights).

### Comparateur & deals

- `GET /compare` — Recherche textuelle (paramètres `q`, `marque`, `categorie`, `limit`) fusionnant SerpAPI + scrapers pour générer une liste de deals normalisés.
- `GET /comparison` — Comparaison multi-produits par identifiants (`ids=1,2,3`, `limit`). Retourne `{ products: [{ product, offers }], summary: DealItem[] }`.

### Historique de prix — `GET /products/{productId}/price-history`

Paramètre `period` (`7d`, `1m`, `3m`, `6m`, `1y`, `all`). Réponse : `points[]` (prix + source + date) et `statistics` (`current`, `lowest`, `highest`, `average`).

### Programmes — `GET /programmes`

Expose `data/programmes.json` (nom, durée, objectif, niveau, focus musculaire). Utilisé par `frontend/src/app/programmes/page.tsx` et la recherche unifiée.

### Gym Locator — `GET /api/gyms`

Consomme `services/gyms_scraper.get_basicfit_gyms()` avec fallback JSON. Paramètres : `query`, `limit`, `city`. Retourne `gyms[]` enrichis (coordonnées, équipements, lien partenaire).

### Recherche unifiée — `GET /search`

Paramètres : `q` (texte libre) + `limit`. Retourne `{ products[], gyms[], programmes[] }` en combinant catalogue agrégé, gyms et programmes.

### Accueil — `GET /`

Réponse de vérification rapide : `{ "message": "API OK ✅ — utilise /compare?q=whey protein" }`.

> ℹ️ Les créations/updates d’alertes continuent de passer par l’API d’orchestration (`POST /price-alerts`). L’agrégation consomme ensuite ces données pour enrichir les vues.

## 3. Webhooks & intégrations

| Route | Description | Source |
|-------|-------------|--------|
| `POST /webhooks/products/refresh` | Déclenche la synchronisation catalogue complète. | `services/scraper` ou partenaires. |
| `POST /webhooks/offers/refresh` | Rafraîchit les offres actives. | Cron / partenaires. |
| `POST /webhooks/alerts/process` | Lance le traitement batch des alertes en file. | Worker Celery. |

Les webhooks sont sécurisés par signature HMAC (`X-FitIdion-Signature`) configurée via `FITIDION_WEBHOOK_SECRET`.

## 4. Observabilité & conventions

- Toutes les réponses sont JSON (`application/json; charset=utf-8`).
- Codes d’erreur normalisés (`400`, `401`, `404`, `422`, `429`, `500`).
- Tracing via `X-Request-ID` généré par FastAPI (`apps/api/app/main.py`).
- Exposition Prometheus optionnelle (`/metrics`) si `ENABLE_METRICS=1` (configurable dans `app/config.py`).

---

📡 *FitIdion API — orchestrée pour la résilience des données fitness et la cohérence avec le frontend Next.js.*
