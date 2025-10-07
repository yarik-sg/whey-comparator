# 💪 Whey Comparator — Frontend

Application Next.js 14 (App Router) qui aide les sportifs à comparer les compléments alimentaires (whey, créatine, etc.) et à suivre les meilleures offres détectées sur les plateformes e-commerce (Amazon, MyProtein, Prozis…).

## ✨ Fonctionnalités clés

- **Landing marketing** : sections Hero, statistiques et logos partenaires pour présenter la proposition de valeur.
- **Catalogue filtrable** : navigation par recherche, tri et filtres (prix, disponibilité, marques, catégories) alimentée par l’API `/products`.
- **Comparateur automatique** : page `/comparison` qui précharge deux références populaires si aucun identifiant n’est fourni et affiche un tableau synthétique + le détail des offres.
- **Fiche produit détaillée** : informations nutritionnelles, sources de données et produits similaires avec graphiques d’historique de prix.
- **Alertes prix** : formulaire dynamique avec validation côté client, messages de statut et possibilité de personnaliser le style via une prop `className`.
- **Comparateur express** : page `/comparateur` connectée aux scrapers SerpAPI/MyProtein pour explorer rapidement les meilleures offres du moment.

## 🧱 Structure du répertoire

```
frontend/
├── public/                     # Assets statiques (icônes, manifest…)
├── src/
│   ├── app/                    # Pages et layouts App Router
│   │   ├── page.tsx            # Landing page
│   │   ├── comparison/         # Comparateur multi-produits (SSR)
│   │   ├── comparateur/        # Comparateur « flash » SerpAPI (client)
│   │   ├── products/           # Catalogue + fiche produit détaillée
│   │   └── catalogue/          # Visualisation Google Sheets
│   ├── components/             # UI réutilisable (cartes, tableaux, formulaires…)
│   ├── lib/                    # Client HTTP et hooks React Query
│   ├── pages/api/              # Routes API Next (proxy scrapers historiques)
│   └── types/                  # Typage des réponses API
├── vendor/                     # Build embarqué de @tanstack/query (zero-install)
├── package.json
└── next.config.ts
```

## 🚀 Démarrage rapide

```bash
cd frontend
npm install
npm run dev
```

Par défaut l’application attend un backend disponible sur `http://localhost:8000`. Pour cibler une autre URL (ou utiliser un proxy edge), définissez l’une des variables d’environnement suivantes :

- `NEXT_PUBLIC_API_BASE_URL` pour le navigateur et le serveur
- `API_BASE_URL` uniquement pour le rendu serveur

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.whey-comparator.dev npm run dev
```

## 📦 Scripts utiles

| Commande            | Description                                                     |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Lance le serveur Next.js en mode développement.                 |
| `npm run build`     | Compile l’application pour la production.                       |
| `npm run start`     | Démarre le serveur Next.js en mode production.                  |
| `npm run lint`      | Analyse statique avec ESLint et les règles Next.js/TypeScript.  |

## 🧠 Points techniques

- **App Router** combinant composants serveur (SSR) et client pour garder les pages critiques rapides tout en offrant des interactions riches.
- **TanStack Query** (vendored) pour le cache réseau (`useProductList`, `usePriceHistory`).
- **Gestion d’état locale** : formulaires contrôlés + hooks `useState`/`useEffect` pour les filtres et la comparaison flash.
- **Accessibilité** : boutons navigables au clavier, aria-labels sur les CTA principaux et messages dynamiques annoncés via `aria-live`.
- **Fallback intelligent** : la page `/comparison` interroge l’API catalogue afin de proposer automatiquement une comparaison pertinente lorsqu’aucun produit n’est sélectionné.

## 🔭 Pistes d’évolution

- Connecter le formulaire d’alertes à une API d’envoi d’e-mails (Sendinblue, Resend…).
- Persister la sélection de produits (localStorage / cookies) pour retrouver ses comparatifs.
- Ajouter un mode « abonnements » permettant de sauvegarder des combinaisons de produits et d’exporter les historiques.

---

💡 Ce dossier représente l’interface utilisateur officielle du projet : il est prêt à être branché sur les services backend existants (`/services` dans le repo) ou sur de nouvelles sources de données temps réel.
