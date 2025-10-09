# API FastAPI — Endpoints disponibles

Cette référence regroupe les routes exposées par l'API Whey Comparator. Deux couches coexistent :

1. **API CRUD historique** (`apps/api/app`) pour la gestion des entités (produits, offres, fournisseurs) — documentée via OpenAPI (Swagger UI sur `/docs`).
2. **API d'agrégation temps réel** (`main.py`) qui combine les scrapers internes et SerpAPI pour alimenter l'interface Next.js (comparateur, fiches produit, historiques).

> ℹ️ Avec l'environnement Docker (`docker compose up --build`), l'API est disponible sur [http://localhost:8000](http://localhost:8000). Les exemples ci-dessous supposent cette base URL.

## 1. Santé & endpoints CRUD (`apps/api/app`)

### Santé

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Vérifie que l'API répond (`{"status": "ok"}`). |

### Produits (`/products`)

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/products` | Liste paginée des produits disponibles. |
| `POST` | `/products` | Crée un nouveau produit. |
| `GET` | `/products/{product_id}` | Retourne un produit par identifiant. |
| `PUT` | `/products/{product_id}` | Met à jour partiellement ou totalement un produit. |
| `DELETE` | `/products/{product_id}` | Supprime un produit (204 No Content). |

**Paramètres de requête `GET /products`**

- `limit` *(int, 1-100, défaut 10)* : taille de page.
- `offset` *(int ≥ 0, défaut 0)* : index de départ.
- `search` *(str)* : filtre sur le nom (ILIKE `%search%`).
- `sort_by` *("name" | "created_at" | "updated_at", défaut `created_at`)* : colonne de tri.
- `sort_order` *("asc" | "desc", défaut `desc`)* : ordre de tri.

### Fournisseurs (`/suppliers`)

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/suppliers` | Liste paginée des fournisseurs/marchands. |
| `POST` | `/suppliers` | Ajoute un fournisseur. |
| `GET` | `/suppliers/{supplier_id}` | Détail d'un fournisseur. |
| `PUT` | `/suppliers/{supplier_id}` | Met à jour un fournisseur. |
| `DELETE` | `/suppliers/{supplier_id}` | Supprime un fournisseur (204). |

**Paramètres de requête `GET /suppliers`**

- `limit` *(int, 1-100, défaut 10)*.
- `offset` *(int ≥ 0, défaut 0)*.
- `search` *(str)* : filtre sur `name` ou `website`.
- `sort_by` *("name" | "created_at" | "updated_at", défaut `created_at`).
- `sort_order` *("asc" | "desc", défaut `desc`).

### Offres (`/offers`)

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/offers` | Liste paginée des offres commerciales. |
| `POST` | `/offers` | Crée une offre pour un produit et un fournisseur. |
| `GET` | `/offers/{offer_id}` | Retourne une offre par identifiant. |
| `PUT` | `/offers/{offer_id}` | Met à jour une offre existante. |
| `DELETE` | `/offers/{offer_id}` | Supprime une offre (204). |

**Paramètres de requête `GET /offers`**

- `limit` *(int, 1-100, défaut 10)*.
- `offset` *(int ≥ 0, défaut 0)*.
- `product_id` *(int)* : filtre par produit.
- `supplier_id` *(int)* : filtre par fournisseur.
- `min_price` *(float ≥ 0)* : prix minimum.
- `max_price` *(float ≥ 0)* : prix maximum.
- `available` *(bool)* : disponibilité exacte (`true` / `false`).
- `sort_by` *("price" | "created_at" | "updated_at", défaut `created_at`).
- `sort_order` *("asc" | "desc", défaut `desc`).

### Schémas de réponse

Toutes les routes de liste renvoient des objets `Paginated*` contenant :

```json
{
  "total": 123,
  "items": [ ... ]
}
```

Les champs individuels sont définis dans `app/schemas.py` (Pydantic v2) :

- `ProductRead` : `id`, `name`, `description`, `created_at`, `updated_at`.
- `SupplierRead` : `id`, `name`, `website`, `contact_email`, `created_at`, `updated_at`.
- `OfferRead` : `id`, `product_id`, `supplier_id`, `price`, `currency`, `url`, `available`, `created_at`, `updated_at`.

Référez-vous à la documentation OpenAPI pour les exemples détaillés.

## 2. Endpoints agrégés (temps réel)

Ces routes sont implémentées dans `main.py` et alimentent directement le frontend (pages catalogue, comparateur et fiches produit).

### Catalogue enrichi (`GET /products`)

- Filtre les produits scrappés et, en cas d'indisponibilité, reconstitue un catalogue via SerpAPI (fallback).
- Paramètres : `search`, `page`, `per_page` *(1-60)*, `min_price`, `max_price`, `brands` (liste), `min_rating`, `in_stock`, `category`, `sort` (`price_asc` par défaut, aussi `price_desc`, `rating`, `protein_ratio`).
- Réponse : liste `products` + pagination (`page`, `perPage`, `total`, `totalPages`, `hasPrevious`, `hasNext`).

【F:main.py†L1323-L1467】

### Détail produit & offres (`GET /products/{product_id}/offers`)

- Agrège les offres issues du scraper (triées, marquées « meilleur prix ») et enrichit avec SerpAPI lorsque nécessaire.
- Paramètre `limit` *(1-24, défaut 10)* pour borner les offres retournées.
- En cas d'ID inconnu côté scraper, bascule automatiquement sur les données SerpAPI ou retourne `404`.

【F:main.py†L1823-L1855】

### Produits similaires (`GET /products/{product_id}/related`)

- Recherche les produits proches (marque, catégorie, ratio nutritionnel) dans les données scrappées.
- Paramètre `limit` *(1-12, défaut 4)*.
- Retourne `{ productId, related[] }` ou `404` si la référence n'existe pas.

【F:main.py†L1858-L1881】

### Historique de prix (`GET /products/{product_id}/price-history`)

- Agrège les points d'historique (source + prix) et calcule les statistiques `lowest`, `highest`, `average`, `current` sur la période demandée.
- Paramètre `period` (`7d`, `1m`, `3m`, `6m`, `1y`, `all` — défaut `3m`).

【F:main.py†L1884-L1947】

### Comparaison multi-produits (`GET /comparison`)

- Accepte une liste d'identifiants (`ids=1,2,3`) et retourne :
  - `summary[]` : top offres croisées (limité à `limit`, défaut 10) ;
  - `products[]` : chaque produit avec ses offres agrégées.
- Valide les identifiants et renvoie `400` si aucun ID exploitable n'est fourni.

【F:main.py†L1950-L1998】
