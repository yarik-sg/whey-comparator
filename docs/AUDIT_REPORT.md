# FitIdion — Rapport d'audit technique

_Date : 2025-11-14_

## Portée et méthodologie
- Analyse complète du dépôt `whey-comparator` (frontend Next.js 15, API FastAPI légère `main.py`, backend complet `apps/api`, services Python et données partagées).
- Lecture manuelle des pages critiques (produits, comparateur, comparateur legacy), des API internes (`/compare`, `/products`, `/search`, `/gyms`, `/comparison`, etc.) et des intégrations SerpAPI/ScraperAPI.
- Cartographie des types exposés côté frontend (`frontend/src/types/api.ts`), des clients (`frontend/src/lib/apiClient.ts`) et du format réel renvoyé par les services Python (`services/product_compare.py`, `services/gyms_scraper.py`).
- Vérification de la compatibilité legacy (`/compare?legacy=true`) et des dépendances externes (SerpAPI, ScraperAPI, scrapers partenaires).

## Synthèse des problèmes identifiés
| # | Problème | Impact | Fichiers concernés | Solution recommandée |
|---|----------|--------|--------------------|-----------------------|
| 1 | Clé SerpAPI codée en dur avec valeur par défaut publique. | Risque de fuite de clé et usage involontaire en production. | `main.py` lignes 36‑43. | Exiger `SERPAPI_KEY` via l'environnement, supprimer la valeur fallback et documenter la variable dans `.env`/README. |
| 2 | `/compare` renvoie deux formats incompatibles (liste legacy vs objet structuré) sans versioning clair. | Les pages utilisant la route moderne (`frontend/src/app/api/compare/route.ts`) et la page legacy (`frontend/src/app/comparateur/page.client.tsx`) doivent connaître le flag `legacy`. Oublier `legacy=true` casse la page comparateur classique. | `main.py` lignes 2854‑2898, `frontend/src/app/comparateur/page.client.tsx` lignes 43‑87. | Documenter le comportement, introduire une négociation explicite (`Accept-Version` ou `mode=legacy` par défaut) puis migrer progressivement la page comparateur vers le format structuré. |
| 3 | Duplication de logique catalogue : `main.py` reconstruit les produits à partir de `fallback_catalogue` tandis que `apps/api/app/routers/products.py` expose la même structure via SQLAlchemy. | Maintenance difficile (deux sources de vérité, schémas proches mais pas identiques). | `main.py` lignes 2918‑3108, `apps/api/app/routers/products.py`. | Extraire un module partagé (ex. `services/catalogue_adapter.py`) ou consommer directement l'API `apps/api` dans le frontend pour réduire les divergences. |
| 4 | Intégrations gyms incohérentes : `/gyms` agrège en temps réel via `services/gyms_scraper.get_partner_gyms`, tandis que `/api/gyms` s'appuie sur le dataset mock `GYM_DIRECTORY`. | Les filtres disponibles diffèrent et les données peuvent être obsolètes ou contradictoires. | `main.py` lignes 2367‑2425 et 2428‑2494, `services/gyms_scraper.py`. | Harmoniser les deux endpoints (ex. `/api/gyms` s'appuie aussi sur `get_partner_gyms` avec pagination), documenter les métadonnées et prévoir un cache partagé. |
| 5 | `services/product_compare` lance des requêtes HTTP depuis un cache global sans pool ni timeouts configurés côté frontend. | Risque de saturation lors de pics (chaque `/compare` moderne déclenche des appels SerpAPI/ScraperAPI). | `services/product_compare.py` lignes 432‑470, `frontend/src/app/api/compare/route.ts`. | Mutualiser un client `httpx.AsyncClient` global avec timeout, instrumenter les erreurs et ajouter une limitation de débit configurable. |
| 6 | Absence de documentation des formats JSON et des conventions legacy. | Onboarding difficile et risque d'intégrer les mauvais champs camelCase vs snake_case. | README historique + absence de fiches détaillées. | Mettre à jour README et créer des fiches (`docs/API_REFERENCE.md`, `docs/PRODUCT_COMPARE_FLOW.md`, etc.). (Livré dans cette mise à jour.) |

## Sources des bugs et incohérences
- **Clé SerpAPI** : paramètre par défaut défini directement dans le code (`main.py`).
- **Compatibilité `/compare`** : drapeau `legacy` requis par la page comparateur App Router, non documenté.
- **Duplication catalogue** : deux implémentations du listing produit (FastAPI léger et backend complet SQLAlchemy) qui divergent sur les champs (`bestPrice` vs `total_price`, `proteinPerEuro`, etc.).
- **Gyms** : deux sources de données (`services/gyms_scraper.get_partner_gyms` vs `GYM_DIRECTORY`).
- **Charge SerpAPI/ScraperAPI** : absence de pooling, chaque requête reconstruit les clients et peut déclencher plusieurs `asyncio.run`.

## Plan d'amélioration suggéré
1. **Sécurisation des secrets**
   - Retirer toutes les valeurs par défaut sensibles.
   - Centraliser la configuration dans `settings.py` (FastAPI) et `env.local.example` (Next.js).
2. **Versionner `/compare`**
   - Introduire un champ `mode` avec valeur par défaut `structured` et retourner systématiquement un objet.
   - Ajouter un adaptateur frontend qui convertit l'objet en liste pour l'UI legacy avant migration complète.
3. **Unifier le catalogue produit**
   - Déplacer la logique dans `apps/api` et exposer un endpoint public `/api/public/products` utilisé par Next.js.
   - Déprécier la reconstruction locale `fallback_catalogue` vers un rôle strictement failover.
4. **Convergence des gyms**
   - Factoriser `get_partner_gyms` dans un service async avec cache partagé Redis (si dispo) et l'utiliser dans toutes les routes.
   - Ajouter des métadonnées communes (`providers_ready`, `supports_geolocation`).
5. **Industrialiser SerpAPI/ScraperAPI**
   - Créer un module `services/vendors` qui gère la rotation des clés et l'ajout de nouveaux fournisseurs (documentation fournie dans `docs/PRODUCT_COMPARE_FLOW.md`).
6. **Documentation vivante**
   - Maintenir un changelog, relier README aux fichiers `docs/*.md` et automatiser la vérification (ex. lint docs dans CI).

## Carte des modules et dépendances
Voir `docs/ARCHITECTURE.md` pour le diagramme détaillé.
