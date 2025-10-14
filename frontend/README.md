# 💪 Whey Comparator — Frontend Next.js

Interface officielle de FitIdion. Elle présente le catalogue, les comparateurs, l'analyse d'historique de prix, les programmes de coaching et le Gym Locator alimentés par l'API FastAPI. La refonte récente apporte un thème lumineux réhaussé d'accents orange, des sections marketing dynamiques et une expérience responsive repensée.

## 🗂️ Architecture du dossier

```
frontend/
├── Dockerfile                # Image de dev Node 20 + Next.js
├── src/
│   ├── app/                    # App Router (pages, layouts, API routes)
│   │   ├── page.tsx            # Landing Hero/Stats/WhyChooseUs
│   │   ├── analyse/            # Tableau de bord historique de prix
│   │   ├── alerts/             # Activation & suivi des alertes
│   │   ├── comparison/         # Comparateur multi-produits (SSR + fallback auto)
│   │   ├── comparateur/        # Comparateur express client-side (SerpAPI)
│   │   ├── catalogue/          # Visualisation catalogue Google Sheets
│   │   ├── equipements/        # Sélection d'équipements FitIdion
│   │   ├── gyms/               # Listing Basic-Fit & partenaires
│   │   ├── programmes/         # Programmes dynamiques issus de `data/programmes.json`
│   │   ├── products/           # Fiches produits + PriceHistoryChart
│   │   ├── search/             # Recherche unifiée (produits, gyms, programmes)
│   │   └── api/catalogue/      # Proxy vers SerpAPI avec contrôles de quota
│   ├── components/             # UI réutilisables (HeroSection, PriceHistoryChart, ProgramCard, GymCard…)
│   ├── components/ui/          # Boutons, inputs, primitives stylées
│   ├── lib/                    # Client HTTP, helpers TanStack Query
│   └── types/                  # Typages pour les réponses API
├── public/                     # Assets statiques (logos, favicon, manifest)
├── vendor/                     # Build vendored de TanStack Query (mode offline)
├── package.json
└── next.config.ts
```

## ⚙️ Fonctionnement du frontend

1. **App Router (Next.js 15)** : mixe composants serveur (SEO, SSR des listes) et client (interactions, formulaires, animations) pour des pages rapides.
2. **Data fetching** : `src/lib/apiClient.ts` gère la résolution des URLs (`NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL`) et normalise les erreurs. Les hooks TanStack Query (`useProductList`, `useOffers`, `usePriceHistory`) alimentent les vues.
3. **Sections clés** : Hero animé, catalogue, comparateurs, page Analyse (PriceHistoryChart), Programmes dynamiques, Gym Locator Basic-Fit, recherche unifiée et formulaire d'alertes prix.
4. **Thème & design system** : couleurs lumineuses (`#f8fafc`, `#0f172a`, accents orange `#f97316`), typographie Inter/Poppins et composants arrondis avec ombres douces.
5. **Accessibilité** : focus visibles, aria-live pour messages formulaire, navigation clavier sur CTA et filtres.

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
