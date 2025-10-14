# FitIdion API — Référence des endpoints

La plateforme FitIdion expose deux couches complémentaires :

1. **API d'orchestration (FastAPI, dossier `apps/api`)** pour la gestion CRUD des produits,
   offres, marchands et alertes prix.
2. **API d'agrégation temps réel (`main.py`)** qui combine scrapers, caches et fallback catalogue
   afin d'alimenter le frontend Next.js 15 (pages catalogue, comparateur, fiches produit, alertes).

Toutes les routes sont servies depuis `http://localhost:8000` en environnement de développement.

## 1. API d'orchestration (`apps/api/app`)

### Santé

| Méthode | Route     | Description                              |
|---------|-----------|------------------------------------------|
| `GET`   | `/health` | Vérifie l'état de l'API (payload `{status: "ok"}`). |

### Ressources principales

| Ressource  | Routes CRUD                                                                                             | Notes clés                                            |
|------------|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Produits   | `GET /products`, `POST /products`, `GET /products/{id}`, `PUT /products/{id}`, `DELETE /products/{id}`  | Champs nutritifs, tags, best-offer, timestamps.       |
| Offres     | `GET /offers`, `POST /offers`, `GET /offers/{id}`, `PUT /offers/{id}`, `DELETE /offers/{id}`            | Filtrage prix, disponibilité, fournisseur, devise.    |
| Fournisseurs | `GET /suppliers`, `POST /suppliers`, `GET /suppliers/{id}`, `PUT /suppliers/{id}`, `DELETE /suppliers/{id}` | Gestion des marchands & URL d'affiliation.           |
| Alertes prix | `GET /price-alerts`, `POST /price-alerts`, `PATCH /price-alerts/{id}`, `DELETE /price-alerts/{id}`     | Activation / désactivation, seuils personnalisés.     |
| Historique de prix | `GET /products/{id}/price-history`                                                               | 30 relevés max + stats (tendance, moyenne, min/max).  |

Les payloads sont définis dans `apps/api/app/schemas.py` (Pydantic v2). Toutes les listes renvoient
le wrapper :

```json
{
  "total": 120,
  "items": [...],
  "limit": 10,
  "offset": 0
}
```

### Paramètres usuels

- `limit` *(1-100, défaut 10)* et `offset` *(≥0)* pour la pagination.
- `search` sur les champs textuels (`name`, `brand`, `supplier`).
- `sort_by` + `sort_order` (`asc`/`desc`).
- Filtres spécifiques (`available`, `min_price`, `max_price`, `supplier_id`, etc.).

## 2. API d'agrégation FitIdion (`main.py`)

Cette couche intègre :

- récupération SerpAPI + scrapers internes,
- enrichissement (ratio protéines/prix, notation, disponibilité temps réel),
- fallback catalogue (`fallback_catalogue.py`) pour résilience offline,
- fusion intelligente des résultats pour le comparateur multiréférences.

### Catalogue enrichi — `GET /products`

Paramètres : `search`, `page` (défaut 1), `per_page` (1-60), `min_price`, `max_price`, `brands[]`,
`category`, `in_stock`, `sort` (`price_asc`, `price_desc`, `rating`, `protein_ratio`).

Réponse : `{ products: ProductCard[], page, perPage, total, totalPages, hasPrevious, hasNext }`.

### Détail produit — `GET /products/{productId}`

Retourne : fiche enrichie (média, nutrition, description), offres actuelles, meilleure offre,
produits similaires, historique de prix.

Endpoints associés :

- `GET /products/{id}/offers` — top offres triées (limite 24).
- `GET /products/{id}/price-history` — données agrégées par jour.
- `GET /products/{id}/similar` — suggestions par marque/catégorie/ratio.

### Historique des prix — `GET /products/{productId}/price-history`

Paramètres : `period` (`7d`, `1m`, `3m`, `6m`, `1y`, `all`). Retourne `points[]` (prix + source + date)
et `statistics` (current/lowest/highest/average) normalisées en `{ amount, currency, formatted }` avec
agrégation fallback si le scraping échoue.

### Comparateur multiréférences — `POST /comparison`

Payload : `{ products: string[] }` (identifiants FitIdion ou textes libres). L'API résout les items,
pré-sélectionne les meilleures offres, fusionne fallback + données live et retourne un résumé
prêt à afficher (scores, métriques nutritionnelles, liens marchands).

### Alertes prix — `POST /price-alerts`

Payload : `{ email, productId, targetPrice }`. Les alertes sont stockées via l'API CRUD puis le
backend orchestre l'envoi (worker Celery).

### Programmes — `GET /programmes`

Retourne la liste structurée de programmes (`data/programmes.json`) exposée au frontend et à la recherche
globale.

### Salles Basic-Fit — `GET /gyms`

Endpoint léger consommant `services/gyms_scraper.get_basicfit_gyms()` pour diffuser les clubs actualisés.
Accepte `query` (nom) et `limit`.

### Recherche unifiée — `GET /search`

Paramètres : `q` (texte libre) + `limit`. Retourne un objet `{ products[], gyms[], programmes[] }` en
aggrégeant SerpAPI (produits), scraping Basic-Fit (gyms) et données `programmes.json` filtrées par nom.

## 3. Webhooks & intégrations

- `POST /webhooks/products/refresh` : déclenche la synchronisation complète catalogue.
- `POST /webhooks/offers/refresh` : relance les scrapers pour les offres actives.
- `POST /webhooks/alerts/process` : traitement batch des alertes en file.

Ces webhooks sont sécurisés via signature HMAC (`X-FitIdion-Signature`). Le secret est défini dans
`FITIDION_WEBHOOK_SECRET`.

## 4. Conventions & monitoring

- Toutes les réponses suivent `application/json; charset=utf-8`.
- Codes d'erreur standardisés (`400`, `401`, `404`, `422`, `429`, `500`).
- Tracing via `X-Request-ID` (injecté côté FastAPI et logué par le frontend).
- Metrics Prometheus activables via l'option `--enable-metrics` (expose `/metrics`).

---

📡 *FitIdion API — bâtie pour l'observabilité et la résilience de la donnée fitness.*
