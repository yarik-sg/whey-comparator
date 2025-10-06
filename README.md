# 🧬 Whey Comparator

Application web construite avec **React 18 + Vite** pour comparer rapidement les compléments alimentaires (whey, créatine, etc.) et suivre leurs meilleures offres comme sur idealo.

## 🚀 Fonctionnalités principales

- **Catalogue interactif** : liste fictive de whey et créatines exposée via React Query avec un délai simulé pour représenter un appel API réel.
- **Filtres dynamiques** : filtrage par marque, type de produit et fourchette de prix avec calcul automatique des bornes.
- **Comparateur de 2 à 4 produits** : tableau responsive affichant prix, remises, nutrition et liens externes.
- **KPI instantanés** : calcul du prix moyen et du meilleur rapport qualité/prix basé sur les protéines par 100 g.
- **Alertes prix** : formulaire avec validation côté client et gestion d'état (Zustand) pour simuler l'inscription à une notification e-mail.

## 🧱 Architecture du projet

```
whey-comparator/
├── src/
│   ├── components/        # UI modulaire (filtres, tableau comparatif, KPI, formulaires)
│   ├── data/              # Catalogue de produits statique (mock)
│   ├── hooks/             # Hooks React Query pour la récupération des données
│   ├── store/             # Stores Zustand (sélection produits, alertes prix)
│   └── App.tsx            # Composition de la page principale
├── index.html             # Point d'entrée Vite
├── package.json           # Scripts npm et dépendances
└── vite.config.ts         # Configuration Vite + React
```

## 🔧 Prérequis

- Node.js 18 ou version supérieure
- npm 9+ (ou pnpm/yarn si vous adaptez les scripts)

## ▶️ Démarrer le projet

```bash
npm install
npm run dev
```

Le serveur Vite démarre généralement sur [http://localhost:5173](http://localhost:5173). Le mode `dev` recharge automatiquement la page.

### Autres scripts utiles

| Commande         | Description                                         |
|------------------|-----------------------------------------------------|
| `npm run build`  | Vérifie les types TypeScript et génère le bundle.   |
| `npm run preview`| Sert la version buildée.                            |
| `npm run lint`   | Analyse le code avec ESLint (règles React + TS).    |

## 🌐 Variables d'environnement

Le store des alertes prix peut envoyer les inscriptions vers un service externe.
Définissez l'URL dans un fichier `.env` à la racine :

```bash
VITE_SERPAI_PRICE_ALERT_URL=https://votre-api.exemple.com/alerts
```

Si la variable n'est pas définie, une simulation locale s'exécute (latence + erreurs aléatoires) pour faciliter le développement.

## 🧠 Points clés de l'implémentation

- **React Query** gère le cache produit (`src/hooks/useProducts.ts`) avec un temps de conservation de 5 minutes.
- **Zustand** gère :
  - la sélection de 2 à 4 produits (`src/store/productSelectionStore.ts`),
  - le formulaire d'alertes prix (`src/store/priceAlertStore.ts`).
- **Tailwind CSS** fournit les styles utilitaires utilisés dans toute l'application.
- Le composant `PriceAlertsSection` encapsule le formulaire, la mise en page marketing et les états de chargement.

## 🔭 Prochaines évolutions envisagées

- Remplacer les données statiques par une API FastAPI/Node et un scraper temps réel.
- Ajouter l'authentification utilisateur pour sauvegarder favoris et alertes.
- Intégrer de vrais graphiques d'historique des prix (Recharts est déjà installé).

---

💡 Ce dépôt sert de base front-end : structure, expérience utilisateur et gestion d'état sont prêtes pour une intégration ultérieure avec des services back-end et des données en temps réel.
