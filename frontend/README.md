# 💪 Whey Comparator — Frontend Next.js

Interface officielle de FitIdion. Elle présente le catalogue, les comparateurs, l'analyse d'historique de prix, les programmes de coaching et le Gym Locator alimentés par l'API FastAPI. La refonte récente apporte un thème lumineux réhaussé d'accents orange, des sections marketing dynamiques et une expérience responsive repensée.

## 🗂️ Architecture du dossier

```
frontend/
├── Dockerfile                     # Image Node 20 + Next.js avec Turbopack
├── README.md                      # Ce guide
├── next.config.ts                 # Config Next.js (headers, images, transpilePackages)
├── package.json                   # Scripts & dépendances UI
├── public/                        # Logos, manifest, favicon placeholder FitIdion
├── src/
│   ├── app/                       # App Router (pages, layouts, sitemaps)
│   │   ├── layout.tsx             # Layout global + ThemeProvider + fonts Inter/Poppins
│   │   ├── globals.css            # Tokens Tailwind FitIdion (radiaux, ombres, surfaces vitrées)
│   │   ├── page.tsx               # Landing (Hero, Stats, Programmes, Gym Locator, CTA)
│   │   ├── analyse/page.tsx       # Tableau de bord historique des prix
│   │   ├── alerts/page.tsx        # Gestion & statut des alertes prix
│   │   ├── catalogue/page.tsx     # Catalogue enrichi (filtres, cards vitrées)
│   │   ├── comparison/page.tsx    # Comparateur multiréférences (SSR + fallback)
│   │   ├── comparateur/page.tsx   # Comparateur express client-side (SerpAPI)
│   │   ├── equipements/page.tsx   # Sélection d’équipements partenaires
│   │   ├── gyms/page.tsx          # Gym Locator connecté au scraper Basic-Fit
│   │   ├── products/[productId]/page.tsx # Fiche produit + `PriceHistoryChart`
│   │   ├── programmes/page.tsx    # Programmes dynamiques (`data/programmes.json`)
│   │   ├── search/page.tsx        # Recherche unifiée (produits, programmes, gyms)
│   │   └── api/catalogue/route.ts # Proxy Next.js → SerpAPI avec quotas
│   ├── components/                # Composants métier & sections marketing
│   │   ├── QueryProvider.tsx      # Provider TanStack Query avec hydrate déporté
│   │   ├── ThemeProvider.tsx      # Contexte mode clair/sombre + stockage local
│   │   ├── HeroSection.tsx        # Hero landing (Framer Motion)
│   │   ├── PriceComparison.tsx    # Tableau comparatif multi-offres
│   │   ├── PriceHistoryChart.tsx  # Graphique Recharts + statistiques API
│   │   ├── GymLocatorSection.tsx  # Section marketing Gym Locator
│   │   ├── PriceAlertForm.tsx     # Formulaire d’activation d’alerte
│   │   ├── ProductCard.tsx        # Carte catalogue (CTA comparateur + alerte)
│   │   ├── SearchBar.tsx          # Barre de recherche unifiée
│   │   ├── SiteHeader.tsx / SiteFooter.tsx
│   │   └── ui/                    # Primitives (button, card, input, checkbox, slider)
│   ├── data/
│   │   └── popularCategories.ts   # Données statiques pour la page catalogue
│   ├── hooks/
│   │   └── useGyms.ts             # Hook de récupération des salles (fallback + API)
│   ├── lib/
│   │   ├── apiClient.ts           # Gestion des URLs (`NEXT_PUBLIC_API_BASE_URL`) + fetcher
│   │   ├── queries.ts             # Hooks TanStack (`useProducts`, `usePriceHistory`…)
│   │   ├── fallbackCatalogue.ts   # Données offline synchronisées avec `fallback_catalogue.py`
│   │   ├── gymLocator.ts          # Helpers de formatage pour la page gyms
│   │   ├── productIdentifiers.ts  # Constantes FitIdion (ID produits)
│   │   └── utils.ts               # Utilitaires (formatage prix, ratio protéines/prix)
│   ├── styles/
│   │   └── fitidion-theme.css     # Classes utilitaires complémentaires au thème Tailwind
│   ├── types/
│   │   └── api.ts                 # Typages des réponses API (Products, Offers, Gyms…)
│   └── pages/api/                 # Routes API legacy (comparateurs partenaires, proxy marchands)
└── vendor/
    ├── tanstack-query-core/       # Build vendored TanStack Query Core (mode offline)
    └── tanstack-react-query/      # Build vendored TanStack React Query
```

> 🧭 Les responsabilités détaillées de chaque module sont reprises dans `docs/architecture.md`.

## ⚙️ Fonctionnement du frontend

1. **App Router (Next.js 15)** : chaque sous-dossier de `src/app` encapsule son route segment (`page.tsx`, loaders optionnels, metadata). Les composants serveur pré-rendent catalogue/comparateur tandis que les composants client gèrent les interactions (formulaires d’alerte, sliders, comparateur express).
2. **Gestion des données** : `src/lib/apiClient.ts` résout automatiquement les environnements (`NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL`) et `src/lib/queries.ts` centralise les hooks TanStack Query (`useProducts`, `useProductDetails`, `usePriceHistory`, `useGyms`). Le fallback (`fallbackCatalogue.ts`) est partagé avec le backend pour rester fonctionnel hors-ligne.
3. **Sections clés** : `HeroSection`, `DealsShowcase`, `ProgramCard`, `GymCard`, `PriceComparison`, `PriceHistoryChart` et `CreatePriceAlert` orchestrent catalogue, comparateur, analytics, programmes et Gym Locator.
4. **Thème & design system** : `src/app/globals.css` déclare les tokens FitIdion (radiaux, ombres, palette orange/or). Les primitives de `src/components/ui` matérialisent les boutons, inputs, slider et checkbox compatibles mode sombre.
5. **Accessibilité & UX** : focus visibles (`focus-visible:ring-2`), messages `aria-live` dans `PriceAlertForm`, navigation clavier dans `FilterSidebar` et `PriceComparison`, skeletons colorés pour réduire le CLS.

## 📚 Bibliothèques principales

- **Next.js 15** avec React 19 & App Router.
- **Tailwind CSS 4** (mode `@import "tailwindcss"` + tokens CSS personnalisés).
- **Framer Motion** pour les animations de sections (Hero, stats).
- **TanStack Query** (vendored) pour le cache et l'invalidation réseau.
- **Recharts** pour les graphiques d'historique de prix.
- **Lucide React** pour l'iconographie.

## ✨ Améliorations récentes

- Intégration du graphique `PriceHistoryChart` avec statistiques issues de `GET /products/{id}/price-history`.
- Nouvelles pages `programmes`, `gyms`, `analyse` et `search` connectées à l'API agrégée FitIdion.
- Refonte UI du comparateur (préchargement de produits, CTA directionnels, animations de transition) et du formulaire d'alertes.

## 📦 Dépendances installées

| Paquet | Rôle |
| --- | --- |
| `next`, `react`, `react-dom` | Framework & runtime UI. |
| `@tanstack/query-core`, `@tanstack/react-query` (vendored) | Cache des données API. |
| `tailwindcss` | Système de styles utilitaires + design tokens. |
| `framer-motion` | Animations d'entrée/sortie. |
| `recharts` | Graphiques (historique de prix, statistiques). |
| `lucide-react` | Icônes vectorielles. |
| `@eslint/eslintrc`, `eslint`, `eslint-config-next` | Qualité et linting. |
| `typescript`, `@types/*` | Typage statique. |

Installez les dépendances via `npm install` (ou `pnpm install` / `yarn install`).

## 🔐 Variables d'environnement

Déclarez vos variables dans `.env.local` :

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | URL de base côté navigateur (ex : `http://localhost:8000`). |
| `API_BASE_URL` | URL côté serveur (SSG/SSR) si différente du public. |
| `SERPAPI_KEY` | Clé pour les routes proxy côté serveur (`/api/catalogue/serp`). |
| `NEXT_PUBLIC_SERPAPI_KEY` | Optionnel : clé exposée au client pour des tests via proxy. |

## 🚀 Lancer le frontend

### Via Docker Compose

Le service `frontend` est intégré au `docker-compose.yml` racine :

```bash
docker compose up --build frontend
```

Les variables `API_BASE_URL` (côté serveur → `http://api:8000`) et `NEXT_PUBLIC_API_BASE_URL` (côté navigateur → `http://localhost:8000`) sont injectées automatiquement. Le conteneur exécute `next dev --turbopack` avec hot reload.

### En local

```bash
cd frontend
npm install
npm run dev
```

L'application tourne sur [http://localhost:3000](http://localhost:3000) et consomme l'API sur `http://localhost:8000` (configurable).

## 🛣️ Roadmap frontend

- [ ] Connecter le formulaire d'alertes prix à une API d'envoi (Resend / Brevo).
- [ ] Persister la sélection du comparateur (localStorage + URL sharing).
- [ ] Ajouter un tableau de bord utilisateur (listes de souhaits, suivis personnalisés).
- [ ] Intégrer de nouvelles catégories (créatine, multivitamines) avec filtres dédiés.
- [ ] Tester et optimiser le rendu mobile (CLS, interactions au scroll).
