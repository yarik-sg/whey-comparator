# PRODUCT COMPARE FLOW

## Objectif
Décrire le pipeline complet de la fonction "Comparer" (routes `/compare`, `/comparateur`, `/compare`, `/comparison`) et l'intégration SerpAPI/ScraperAPI.

## 1. Sources de données
1. **SerpAPI** — endpoint `google_product` et `google_shopping` utilisés dans `services/product_compare.py` (`fetch_serpapi_offers`, `fetch_serpapi_product_offers_bulk`).
2. **ScraperAPI** — utilisé pour requêter les marchands qui nécessitent un proxy/rotation (`SCRAPERAPI_KEY`).
3. **Scrapers internes** — `services/scraper/src/*` (Amazon, Cdiscount, Carrefour) qui renvoient des `ScraperOffer` consommés par `convert_scraper_offer_to_deal`.
4. **Fallback catalogue** — `fallback_catalogue.py` + `data/*.json` pour assurer une réponse même si SerpAPI est indisponible.

## 2. Étapes du flux `/compare`
1. **Front (Next.js)**
   - `/comparateur` appelle directement `GET /compare?legacy=true` via `apiClient`. Les filtres UI (marque, catégorie, min/max) sont appliqués côté client.
   - `/compare` (nouvelle page) passe par `/api/compare` (route Next). Cette route valide les paramètres (`q`, `brand`, `img`, `url`), appelle `GET /compare` et transforme les clés en camelCase.
2. **FastAPI (`main.py`)**
   - Reçoit les paramètres, décide du mode (legacy vs structuré).
   - Mode legacy :
     1. `collect_serp_deals` interroge SerpAPI Shopping et précharge les `product_id` pour récupérer des offres détaillées.
     2. `collect_scraper_deals` transforme les résultats des scrapers maison (formats `ScraperOffer`).
     3. `mark_best_price` identifie l'offre la moins chère et marque `bestPrice=true`.
   - Mode structuré :
     1. Appelle `compare_product` (service async) via `asyncio.run`.
     2. `compare_product` invoque `_load_or_fetch` qui retourne (ou calcule) `offers`, `price_stats`, `history`, `reference_image`.
     3. `build_price_stats` et `build_price_history` synthétisent les données (min/max/avg, points hebdomadaires).
     4. La réponse `ProductComparisonResponse` est renvoyée telle quelle (snake_case).
3. **Service `product_compare`**
   - Construit un cache en mémoire (`_cache` + TTL `COMPARE_CACHE_TTL_SECONDS`).
   - Utilise `httpx.AsyncClient` ponctuellement (actuellement recréé à chaque appel) pour interroger SerpAPI et ScraperAPI.
   - Normalise les offres (`OfferOut`), notamment : `seller`, `price`, `price_text`, `url`, `image`, `rating`, `reviews`, `shipping_text`, `shipping_cost`.
   - Calcule `PriceStatsOut` et `PriceHistoryPoint` (pas plus de 8 points, step 7 jours).
4. **UI**
   - `/api/compare` convertit `price_stats` → `price` (camelCase) et normalise les textes (`priceFormatter`).
   - `frontend/src/app/compare/page.tsx` affiche min/max/avg, l'image du produit, les CTA "Voir l'offre".
   - `/comparateur` mappe `DealItem[]` sur des cartes simplifiées (prix, vendeur, badge bestPrice).

## 3. Flux `/comparison`
- Paramètre `ids` (CSV) → `build_cached_serp_product_detail` (si `product_id` connu) sinon fallback catalogue.
- `aggregate_offers_for_product` combine les offres locales + SerpAPI pour chaque produit.
- Résultat : `{ products: [{ product: ProductSummary, offers: DealItem[] }], summary: DealItem[] }`.

## 4. Ajout d'un fournisseur externe
1. **Scraper** : implémenter un fetcher renvoyant `{ id, source, url, price, currency, shipping_cost, stock_status }`.
2. **Enregistrement** :
   - Mode rapide : ajouter le fournisseur dans `SCRAPER_TARGETS` (`services/product_compare.py`) pour être interrogé via ScraperAPI (si accessible via moteur de recherche interne).
   - Mode complet : créer un module dans `services/scraper/src`, exposer une API (HTTP ou message queue) et consommer la réponse via `collect_scraper_deals`.
3. **Normalisation** : mettre à jour `convert_scraper_offer_to_deal` si des champs spécifiques doivent être interprétés (poids, format, tags).
4. **Tests** :
   - Lancer `uvicorn main:app`.
   - Appeler `GET /compare?q=<produit>` et vérifier que l'offre apparaît avec `source` explicite.
   - Vérifier `/products/{id}/offers` pour confirmer l'intégration dans la comparaison multi-produits.

## 5. Résilience & cache
- `local_cache` (JSON sur disque) conserve les réponses récentes des scrapers (gym directory, SerpAPI) pour servir un fallback si SerpAPI renvoie une erreur.
- Le middleware `simple_cache_middleware` dans `main.py` met en cache les réponses GET/HEAD pendant `API_CACHE_TTL_SECONDS`.
- Les pages Next configurent `cache: "no-store"` pour éviter de servir des données obsolètes sur les comparaisons.

## 6. Formats de données impliqués
- **Legacy** : `DealItem` (camelCase) + `bestPrice` booléen.
- **Structuré** : `ProductComparisonResponse` (snake_case) → converti en `CompareProductResponse` (camelCase) côté Next.
- **Historique** : `PriceHistoryEntry` (ISO date, prix float ou `null`).

## 7. Points de vigilance
- Le paramètre `legacy` doit rester supporté jusqu'à migration complète de `/comparateur`.
- Documenter les clés API (SerpAPI/ScraperAPI) et ne pas conserver de valeur fallback dans le code.
- Mutualiser un client HTTP asynchrone pour éviter les surcharges `asyncio.run` multiples.
- Ajouter du monitoring (latence SerpAPI, taux de cache hit) pour anticiper les quotas.
