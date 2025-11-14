# API REFERENCE

Cette référence couvre les endpoints exposés par l'API FastAPI légère (`main.py`) et rappelle les routes principales du backend complet (`apps/api`). Les formats JSON correspondent aux interfaces TypeScript définies dans `frontend/src/types/api.ts`.

## 1. API publique (`main.py`)
### 1.1 Comparateur
| Route | Description | Paramètres |
|-------|-------------|------------|
| `GET /compare` | Compare un produit ou une requête. | `q` (string, requis hors mode legacy), `marque`/`brand`, `categorie`, `img`, `url`, `limit` (1‑24), `legacy` (bool). |

- **Réponse (legacy=true)** : `DealItem[]` (cf. `frontend/src/types/api.ts`). Chaque item contient `price`, `totalPrice`, `shippingCost`, `inStock`, `source`, `productId`.
- **Réponse (par défaut)** :
  ```json
  {
    "query": "whey isolate chocolat",
    "product": { "name": "whey isolate chocolat", "brand": "MyProtein" },
    "price_stats": { "min": 19.9, "max": 32.5, "avg": 24.1 },
    "offers": [ { "seller": "Amazon", "price": 22.99, ... } ],
    "history": [ { "date": "2024-01-05", "price": 24.9 }, ... ]
  }
  ```
- **Compatibilité** : la route Next `/api/compare` convertit ce JSON en camelCase (`price`, `priceText`, `history[]`).

### 1.2 Catalogue produits
| Route | Description | Paramètres |
|-------|-------------|------------|
| `GET /products` | Liste paginée. | `search`, `page`, `per_page`, `sort` (`price_asc`, `price_desc`, `rating`, `protein_ratio`), `min_price`, `max_price`, `min_rating`, `category`, `in_stock`, `brands[]`.
| `GET /products/{id}` | Détails produit (si présent dans le fallback catalogue). |
| `GET /products/{id}/offers` | Offres agrégées. | `limit` (défaut 10).
| `GET /products/{id}/price-history` | Historique sur période (`period=7d/1m/3m/6m/1y`). |
| `GET /products/{id}/reviews` | Agrégation des avis. |
| `GET /products/{id}/similar` | Produits similaires. |
| `GET /products/{id}/related` | Produits complémentaires. |
| `GET /comparison` | Comparaison multi-produits (`ids` CSV ou `?ids=12,42`). |

**Réponse `/products`** :
```json
{
  "products": [
    {
      "id": "myprotein-impact-whey",
      "name": "Impact Whey",
      "brand": "MyProtein",
      "bestPrice": { "amount": 19.99, "currency": "EUR", "formatted": "19,99 €" },
      "offersCount": 6,
      "rating": 4.7,
      "proteinPerEuro": 3.2,
      "pricePerKg": 14.5
    }
  ],
  "pagination": { "page": 1, "perPage": 12, "total": 120, "totalPages": 10, "hasPrevious": false, "hasNext": true }
}
```

### 1.3 Gyms & programmes
| Route | Description | Paramètres |
|-------|-------------|------------|
| `GET /gyms` | Listing temps réel (scraping partenaires). | `query`, `limit`.
| `GET /api/gyms` | Endpoint complet (legacy). | `city`, `max_distance_km`, `lat`, `lng`, `limit`.
| `GET /programmes` | Programmes statiques depuis `data/programmes.json`. | — |

### 1.4 Recherche unifiée
| Route | Description |
|-------|-------------|
| `GET /search` | Regroupe `products`, `gyms`, `programmes`. Paramètres identiques à `/products` (`q`, `nom`, `categorie`, `marque`, `limit`). |

## 2. Routes Next.js (`frontend/src/app/api`)
| Route | Rôle |
|-------|------|
| `GET /api/compare` | Adaptateur : reçoit les paramètres du client, appelle `GET /compare`, convertit l'objet en camelCase. |
| `GET /api/search` | Proxy direct vers `GET /search`. |
| `GET /api/catalogue/serp` | Expose le cache SerpAPI (debug interne). |
| `GET /api/image-proxy` | Proxy images pour éviter le mixed-content. |
| `GET /api/proxy` | Passerelle générique (toutes méthodes) utilisée par `apiClient` quand aucune base URL n'est disponible côté navigateur. |

## 3. Backend complet (`apps/api`)
### 3.1 Endpoints principaux
| Route | Description |
|-------|-------------|
| `GET /products` | Version SQL de la liste (filtres similaires à l'API légère). |
| `GET /products/{id}` | Retourne `schemas.ProductRead`. |
| `GET /products/{id}/offers` | Offres stockées en base. |
| `GET /products/{id}/price-history` | Historique persistant (basé sur `PriceHistory`). |
| `GET /offers` | Pagination + filtres par `product_id`, `supplier_id`, `available`. |
| `POST /offers` | Crée une offre et enregistre un snapshot historique. |
| `GET /suppliers` / `POST /suppliers` | CRUD fournisseurs. |
| `GET /price-alerts` / `POST /price-alerts` | Gestion des alertes utilisateurs. |

### 3.2 Schémas (extraits)
- `schemas.ProductSummary` : équivalent backend de `ProductSummary` (float `protein_per_euro`, `price_per_kg`).
- `schemas.DealItem` : champs `snake_case` mais convertibles facilement (`model_dump()` vs camelCase frontend).
- `schemas.PriceAlert` : `user_email`, `product_id`, `target_price`, `platform`, `active`.

## 4. Formats JSON de référence
- **Money (`ApiPrice`)** : `{ "amount": 24.99, "currency": "EUR", "formatted": "24,99 €" }`.
- **DealItem** :
  ```json
  {
    "id": "google-123",
    "title": "MyProtein Impact Whey",
    "vendor": "Amazon",
    "price": { "amount": 24.99, "currency": "EUR", "formatted": "24,99 €" },
    "totalPrice": { "amount": 28.48, "currency": "EUR", "formatted": "28,48 €" },
    "shippingCost": 3.49,
    "shippingText": "Livraison 48h",
    "inStock": true,
    "source": "Google Shopping",
    "productId": "impact-whey"
  }
  ```
- **ProductComparisonResponse** (mode moderne) : voir section 1.1.
- **ComparisonResponse** : `{ products: [{ product, offers }], summary: DealItem[] }`.

## 5. Notes de compatibilité
- Tous les endpoints conservent les champs camelCase historiques pour les frontends existants. Les nouveaux services peuvent utiliser `snake_case` côté backend, mais les routes Next doivent assurer la conversion.
- `/compare` : documenter et tester systématiquement les deux modes (`legacy`, `structured`).
- Les APIs `apps/api` exposent les mêmes concepts mais peuvent renvoyer des `Decimal`; utilisez les `response_model` Pydantic pour garantir la sérialisation float.

Pour des explications de flux détaillées (SerpAPI/ScraperAPI, priorités d'offres), consultez `docs/PRODUCT_COMPARE_FLOW.md`.
