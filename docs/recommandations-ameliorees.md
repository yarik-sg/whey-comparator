# Plan d'amélioration Whey Comparator (vs Idealo)

## 1. Corrections des constats initiaux
Les éléments suivants sont déjà implémentés ou partiellement livrés :

- **Historique de prix complet** : l'API principale expose `/products/{product_id}/price-history` avec agrégation (période, stats) et s'appuie sur le service scraper pour requêter la table `price_history`. 【F:main.py†L201-L228】【F:main.py†L908-L980】【F:services/scraper/src/scraper/database.py†L21-L85】【F:services/scraper/src/scraper/main.py†L64-L87】
- **Visualisation front** : le composant `PriceHistoryChart` affiche un AreaChart Recharts avec choix de période et indicateurs, utilisé sur la page produit. 【F:frontend/src/components/PriceHistoryChart.tsx†L1-L175】【F:frontend/src/app/products/[productId]/page.tsx†L45-L148】
- **Filtres et tri avancés** : `/products` accepte prix min/max, marques, note, disponibilité, catégorie et différents tris (prix, note, ratio protéine/€). L'IU propose une sidebar interactive, un dropdown de tri, pagination et compte des résultats. 【F:main.py†L779-L880】【F:frontend/src/app/products/page.tsx†L1-L220】【F:frontend/src/components/FilterSidebar.tsx†L1-L197】【F:frontend/src/components/SortDropdown.tsx†L1-L34】
- **Comparaison multi-produits** : la page `/comparison` synthétise les meilleures offres et le détail produit/offres, réutilise les composants communs et gère les états de chargement/erreur. 【F:frontend/src/app/comparison/page.tsx†L1-L120】
- **Tableau des offres enrichi** : affichage des frais de port, badge "Meilleur prix", ratio €/kg, disponibilité et CTA externe sont déjà présents. 【F:frontend/src/components/OfferTable.tsx†L1-L120】

Ces fondations sont solides : le plan d'action doit donc se concentrer sur les vrais écarts fonctionnels, la robustesse et la finition UI.

## 2. Écarts réels et opportunités

### 2.1 Fiabilité & scalabilité backend
| Problème | Impact | Recommandation |
| --- | --- | --- |
| Filtrage/tri réalisés en mémoire après un fetch HTTP vers le scraper | Montée en charge limitée, tri partiel (pas de popularité, de disponibilité cross-fournisseurs). | Déporter les filtres/tri dans le service scraper (SQL) et ne transférer que la page courante ; ajouter champs `popularity`, `lastPriceDrop` pour enrichir le tri. 【F:main.py†L792-L880】 |
| Absence de cache / fallback si le scraper est indisponible | Sensibilité aux pannes réseau ; SLA fragile. | Ajouter une couche de cache (Redis) côté FastAPI pour les listes/price history, et renvoyer le dernier snapshot valide en cas d'échec. |
| Alertes prix côté Next.js ne font que logguer (pas de persistance). | Feature marketing non fonctionnelle, impossible d'envoyer des emails. | Exposer un endpoint FastAPI `/alerts` qui écrit en base + déclenche une file (ex : Redis/worker) ; faire pointer la route Next.js vers cette API. 【F:frontend/src/app/api/alerts/route.ts†L1-L52】 |
| Pas de recalcul automatique de l'historique (uniquement via collecteurs). | Historique potentiellement creux selon les horaires de scraping. | Planifier un job (celery/APScheduler) pour normaliser les données (agrégation quotidienne, déduplication, interpolation pour les jours manquants). |

### 2.2 Expérience Produit & UI
| Manque | Pourquoi c'est important | Proposition |
| --- | --- | --- |
| Pas de recommandations/similaires en bas de la page produit. | Idéal pour cross-sell et pour rapprocher l'expérience d'Idealo. | Ajouter `/products/{id}/related` (basé sur marque, catégorie, profil nutritionnel) et une section "Produits alternatifs" sur la page produit. |
| Comparaison : aucune mise en avant des gagnants par critère. | L'utilisateur doit parcourir chaque tableau pour comprendre. | Ajouter un bandeau de synthèse (meilleur prix, meilleur ratio, meilleure note) et coloration des cellules gagnantes. 【F:frontend/src/app/comparison/page.tsx†L84-L113】 |
| Page catalogue : pas de sauvegarde des filtres (localStorage) ni d'URL partageable du comparateur. | UX perfectible, friction sur mobile. | Persister les filtres localement, proposer un bouton "Copier l'URL de comparaison" et ajouter un mode liste sur mobile. |
| Page produit : pas de timeline des variations (sparkline) dans le header, ni d'indicateur de tendance. | Les visiteurs veulent savoir si le prix actuel est intéressant sans scroller. | Résumer `statistics` dans le hero (badge "-12% vs 30 jours", tendance flèche). 【F:main.py†L975-L979】【F:frontend/src/components/PriceHistoryChart.tsx†L158-L172】 |
| Avis utilisateurs : seule l'offre principale remonte rating/count. | Moins riche qu'Idealo qui compile des avis. | Étendre le scraper pour collecter les avis SerpAPI + Amazon et afficher un agrégat + extraits (top positif/négatif). |

### 2.3 Données & différenciation
- **Indice nutritionnel** : calculer protéines/sucres par dose et synthèse "score performance" pour mieux comparer au-delà du prix. Les attributs existent partiellement via le scraper (`protein_per_serving_g`, `serving_size_g`). 【F:frontend/src/components/ProductCard.tsx†L10-L72】
- **Analyse des frais de livraison** : stocker `shipping_cost`/`shipping_text` dans la base (déjà prévus côté modèle) mais enrichir l'algorithme pour estimer le coût total (TTC + port) et afficher un graphe comparatif. 【F:services/scraper/src/scraper/database.py†L42-L75】【F:frontend/src/components/OfferTable.tsx†L21-L78】
- **Transparence des sources** : l'encart "Flux de données" est statique. Automatiser la liste des collectes récentes + statut du scraper, et afficher un badge "MAJ il y a X min". 【F:frontend/src/app/products/[productId]/page.tsx†L98-L148】

## 3. Priorisation recommandée (vision 3 semaines)

1. **Fiabiliser l'infra (Semaine 1)**
   - Migrer le filtrage/tri dans le scraper (SQL + pagination), mettre en place un cache Redis côté FastAPI.
   - Créer l'API d'alertes (FastAPI + stockage) et remplacer la route Next.js par un appel serveur → backend.
   - Ajouter un job cron (APScheduler) dans le scraper pour densifier `price_history` et recalculer les stats quotidiennes.

2. **Accentuer la valeur utilisateur (Semaine 2)**
   - Ajouter `related products` et "section tendances" sur la page produit.
   - Bonifier la comparaison : surlignage des meilleures valeurs, export partageable, compteur d'items comparés.
   - Mettre à jour le header produit avec badge tendance (hausse/baisse vs période sélectionnée).

3. **Différenciation / Delight (Semaine 3)**
   - Centraliser les avis multi-sources + affichage sur carte produit et comparateur.
   - Implémenter un tableau nutritionnel/score et un graphe comparatif des frais de livraison.
   - Industrialiser les alertes prix (envoi email via worker) et notifier dans l'IU (toasts + historique des alertes).

## 4. Mesures de succès
- Taux de disponibilité API > 99 % grâce au cache et au fallback.
- Temps de réponse `/products` < 500 ms p95 après migration SQL.
- +20 % de clics sur comparateur suite à la mise en avant des gagnants.
- ≥ 30 % des pages produit avec recommandations similaires cliquées.
- Conversion des alertes : > 25 % des utilisateurs qui créent une alerte reviennent via email.

Ce plan capitalise sur ce qui est déjà en place tout en comblant les vrais écarts fonctionnels face à Idealo.
