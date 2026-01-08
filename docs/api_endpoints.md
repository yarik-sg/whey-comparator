# FitIdion API — Référence des endpoints

La plateforme expose deux couches complémentaires :

1. **Backend principal (`main.py`)** — API d'agrégation à la racine du projet, utilisée pour le déploiement sur Render.
2. **Backend avancé (`apps/api/app`)** — API optionnelle pour la gestion CRUD persistante avec PostgreSQL.

Toutes les routes sont servies depuis `http://localhost:8000` en développement.

---

## 1. Backend principal — `main.py` (racine du projet)

Cette API est le **point d'entrée principal** pour le déploiement. Elle combine :

- Résultats SerpAPI + scrapers internes (`services/scraper`).
- Enrichissement FitIdion (ratio protéines/prix, notation, disponibilité temps réel).
- Fallback catalogue (`fallback_catalogue.py`) pour la résilience offline.
- Scraper gyms (`services/gyms_scraper.py`).

### Accueil — `GET /`

Réponse de vérification rapide : `{ "message": "API OK ✅ — utilise /compare?q=whey protein" }`.

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

---

## 2. Backend avancé — `apps/api/app` (optionnel)

Ce backend fournit une persistance PostgreSQL et des workers Celery. **Pour un déploiement simple, le backend principal suffit.**

| Ressource | Routes | Notes |
|-----------|--------|-------|
| Healthcheck | `GET /health` | Retour `{ "status": "ok" }`. |
| Produits | `GET /products`, `POST /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}` | CRUD complet avec champs nutritionnels. |
| Historique de prix | `GET /products/{id}/price-history` | 30 relevés max + stats. |
| Offres | `GET /offers`, `POST /offers`, `GET /offers/{id}`, `PUT /offers/{id}`, `DELETE /offers/{id}` | Filtres prix, disponibilité, marchands. |
| Fournisseurs | `GET /suppliers`, `POST /suppliers`, `GET /suppliers/{id}`, `PUT /suppliers/{id}`, `DELETE /suppliers/{id}` | Gestion des marchands. |
| Alertes prix | `GET /price-alerts`, `POST /price-alerts`, `PATCH /price-alerts/{id}`, `DELETE /price-alerts/{id}` | Activation/désactivation, seuils personnalisés. |

### Paramètres communs

- `limit` *(1-100, défaut 10)* et `offset` *(≥0)* pour la pagination.
- `search` sur les champs textuels (`name`, `brand`, `supplier`).
- `sort_by` + `sort_order` (`asc`/`desc`).
- Filtres spécifiques (`available`, `min_price`, `max_price`, `supplier_id`, `category`, etc.).

### Traitements asynchrones

- `app/tasks.py` gère l'ingestion et le traitement des alertes.
- `app/email.py` envoie les notifications suite aux alertes déclenchées.
- `app/scheduler.py` (APScheduler) planifie les rafraîchissements périodiques.

---

## 3. Webhooks & intégrations

| Route | Description | Source |
|-------|-------------|--------|
| `POST /webhooks/products/refresh` | Déclenche la synchronisation catalogue complète. | `services/scraper` ou partenaires. |
| `POST /webhooks/offers/refresh` | Rafraîchit les offres actives. | Cron / partenaires. |
| `POST /webhooks/alerts/process` | Lance le traitement batch des alertes en file. | Worker Celery. |

Les webhooks sont sécurisés par signature HMAC (`X-FitIdion-Signature`) configurée via `FITIDION_WEBHOOK_SECRET`.

---

## 4. Observabilité & conventions

- Toutes les réponses sont JSON (`application/json; charset=utf-8`).
- Codes d'erreur normalisés (`400`, `401`, `404`, `422`, `429`, `500`).
- Tracing via `X-Request-ID` généré par FastAPI.
- Exposition Prometheus optionnelle (`/metrics`) si `ENABLE_METRICS=1`.

---

📡 *FitIdion API — orchestrée pour la résilience des données fitness et la cohérence avec le frontend Next.js.*
