# FRONTEND

## Stack & conventions
- Next.js 15 (App Router, Turbopack ready) + React 19.
- TypeScript strict (hérite des réglages `tsconfig.json` et `eslint.config.js`).
- Styling : Tailwind CSS (tokens définis dans `frontend/src/app/globals.css` et `tailwind.config.ts`).
- Données : `@tanstack/react-query` pour le catalogue/avis, fetch direct via `apiClient` ailleurs.
- UI : composants maison dans `frontend/src/components` (cards, badges, formulaires) et primitives `@/components/ui/*`.

## Organisation
```
frontend/
├─ src/app/
│  ├─ page.tsx (landing)
│  ├─ products/ (catalogue)
│  ├─ comparateur/ (nouveau moteur)
│  ├─ compare/ (page legacy Next 12 migrée)
│  ├─ comparison/ (multi-produits)
│  ├─ api/ (proxy/compare/search/catalogue)
│  └─ ... autres pages marketing, dashboards, legal
├─ src/lib/
│  ├─ apiClient.ts (client HTTP universel)
│  ├─ queries.ts (hooks TanStack)
│  ├─ compareNavigation.ts, productIdentifiers.ts (helpers)
│  └─ images.ts, siteMetadata.ts
└─ src/types/api.ts (contrats JSON alignés sur `main.py`)
```

## Pages critiques
### `/products`
- Client : `frontend/src/app/products/page.client.tsx`.
- Récupère `ProductListResponse` via `useProductList` (`GET /products`).
- Filtres : prix min/max, note minimale, catégorie, disponibilité, marques multiples.
- Trie : `price_asc` (défaut), `price_desc`, `rating`, `protein_ratio` (idéal pour optimiser le ratio protéine/€).
- Actions : bouton "Comparer" (vers `/comparison?ids=...`), module d'alertes (`PriceAlertsSection`).

### `/comparateur`
- UI grand public (Hero + liste d'offres).
- Fetch direct `GET /compare?legacy=true` via `apiClient` pour conserver le format `DealItem[]`.
- Filtres supplémentaires (marque, catégorie, prix min/max) appliqués côté client.
- À terme, migrer vers le format structuré décrit dans `/api/compare`.

### `/compare`
- Expérience détaillée (résumé produit, min/max/avg, historique de prix, CTA).
- Appelle la route Next `/api/compare` qui convertit l'objet `ProductComparisonResponse` (`snake_case`) en camelCase.
- Stocke la dernière comparaison dans `localStorage` (`fitidion:lastCompare`).

### `/comparison`
- Compare jusqu'à 4 produits via `ids` (CSV). Construit la vue à partir de `ComparisonResponse` (`GET /comparison`).

## API client & types
- `apiClient.get(path, { query, cache })` gère automatiquement :
  - Base URL (navigateur : `NEXT_PUBLIC_API_BASE_URL`; serveur : `API_BASE_URL` ou fallback `http://localhost:8000`).
  - Proxy (`/api/proxy`) si aucune base n'est définie côté navigateur (utile pour éviter le CORS local).
  - Sérialisation des `URLSearchParams`.
- Les types TypeScript (`frontend/src/types/api.ts`) suivent la nomenclature camelCase, même si l'API renvoie certains champs `snake_case`. L'adaptation est faite dans les routes Next (`frontend/src/app/api/compare/route.ts`, `/api/catalogue/serp`, etc.).

## Cohérence des types
- `DealItem` (pages comparateur et catalogues) attend `price` et `totalPrice` de type `ApiPrice { amount, currency, formatted }`. L'API legacy `/compare` renvoie déjà ce format via `build_deal_payload` (cf. `main.py`).
- `ProductSummary` reflète les données combinées SERP + fallback (`bestPrice`, `proteinPerEuro`).
- `PriceHistoryResponse` et `ProductReviewsResponse` sont utilisés par les composants `PriceHistoryChart` et `ReviewHighlights`.
- Si vous consommez l'objet structuré `/compare`, utilisez les types locaux de `/app/api/compare/route.ts` ou créez une définition partagée (`CompareProductResponse`).

## Bonnes pratiques de développement
1. **SSR vs client** : gardez les accès `window` dans des hooks client (`"use client"`). Les pages critiques (`products`, `comparateur`, `compare`) respectent ce pattern.
2. **Chargement** : utilisez les skeletons existants (`ProductCardSkeleton`) et les états `isLoading/isFetching` fournis par React Query.
3. **Accessibilité** : les composants Tailwind incluent déjà les attributs `aria`. Respectez la nomenclature lors de l'ajout de nouveaux champs.
4. **Types** : n'étendez les interfaces qu'à partir de `frontend/src/types/api.ts` pour éviter les divergences avec les réponses backend.
5. **API routes Next** : 
   - `/api/compare` : adaptateur serp/scraper.
   - `/api/search` : proxy vers `GET /search`.
   - `/api/catalogue/serp` : expose les caches SerpAPI.
   - `/api/proxy` : passerelle générique (utilise `apiClient` en mode proxy pour éviter les CORS).

## Commandes utiles
```bash
# Installer les dépendances frontend
npm install --prefix frontend

# Lancer le dev server Next.js
npm run dev --prefix frontend

# Lancer les tests TypeScript/lint
npm run lint --prefix frontend
```

## Références croisées
- Contrats JSON : `docs/API_REFERENCE.md`.
- Architecture globale : `docs/ARCHITECTURE.md`.
- Flux comparateur : `docs/PRODUCT_COMPARE_FLOW.md`.
