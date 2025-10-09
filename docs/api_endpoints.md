# API FastAPI — Endpoints disponibles

Cette référence regroupe les routes exposées par l'API Whey Comparator (`apps/api/app`). Toutes les réponses sont au format JSON et documentées via OpenAPI (Swagger UI sur `/docs`).

## Santé

| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Vérifie que l'API répond (`{"status": "ok"}`). |

## Produits (`/products`)

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

## Fournisseurs (`/suppliers`)

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

## Offres (`/offers`)

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

## Schémas de réponse

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
