# 🏗️ Whey-Comparator - Architecture & Feuille de Route

## 📋 Vue d'Ensemble du Projet

**Whey-Comparator** est une application web React/Vite permettant aux utilisateurs de comparer les prix et caractéristiques des suppléments alimentaires (protéines, créatine, etc.) à travers plusieurs plateformes e-commerce.

---

## ⚙️ Variables d'Environnement

### Backend (FastAPI – `main.py`)

- `SERPAPI_KEY` : clé API SerpAPI utilisée pour interroger Google Shopping.
- `SCRAPER_BASE_URL` : URL de base du service scraper FastAPI (`services/scraper`) exposant `/products` et `/products/{id}/offers`.
- `API_BASE_URL` *(optionnel)* : URL publique de l'API principale (utile pour les appels côté serveur du frontend).

### Frontend (Next.js – `frontend/`)

- `NEXT_PUBLIC_API_BASE_URL` : URL publique utilisée dans le navigateur pour atteindre l'API FastAPI.
- `API_BASE_URL` *(optionnel)* : fallback côté serveur (App Router) si `NEXT_PUBLIC_API_BASE_URL` n'est pas défini.

Toutes les requêtes front passent par `frontend/src/lib/apiClient.ts` qui injecte automatiquement ces URLs et gère la sérialisation JSON.

---

## 🔄 Flux de Données Temps Réel

1. **Collecte** : le service scraper (`services/scraper`) agrège en continu les offres Amazon/MyProtein/Google Shopping et les persiste (PostgreSQL).
2. **Enrichissement à la demande** : `main.py` combine ces données persistées avec les résultats temps réel SerpAPI via les endpoints `/compare`, `/products`, `/products/{id}/offers` et `/comparison`.
3. **Diffusion** : le frontend consomme ces endpoints via le client API partagé, met en cache côté React et affiche les meilleures offres avec recalcul du « best price ».
4. **Pages dédiées** :
   - `/products` liste le catalogue issu du scraper.
   - `/products/{id}` fusionne offres persistées et SerpAPI pour un produit.
   - `/comparison` compare plusieurs IDs (query `ids=1,2,3`).
   - `/comparateur` déclenche des recherches dynamiques sur `/compare` à partir d’un mot-clé.

Cette chaîne permet de déclencher des comparaisons quasi temps réel tout en capitalisant sur l'historique du scraper.

---


## 🎯 Architecture Globale

### Stack Technique Recommandée

#### **Frontend**
- **Framework**: React 18+ avec Vite
- **Routing**: React Router v6
- **State Management**: 
  - React Context API (état global léger)
  - TanStack Query (React Query) pour le cache et les requêtes API
- **Styling**: 
  - Tailwind CSS (déjà configuré avec Vite)
  - shadcn/ui pour les composants UI
- **Graphiques**: Recharts pour les comparaisons de prix
- **Formulaires**: React Hook Form + Zod pour la validation

#### **Backend/API Layer**
- **Option 1 (Recommandée)**: Backend Node.js séparé
  - Express.js ou Fastify
  - API RESTful ou GraphQL
  - Base de données: PostgreSQL (produits) + Redis (cache)
  
- **Option 2**: Backend-as-a-Service
  - Supabase (PostgreSQL + Auth + Storage)
  - Vercel Edge Functions pour le scraping

#### **Data Collection (Scraping)**
- **Node.js** avec:
  - Puppeteer/Playwright (scraping JavaScript)
  - Cheerio (parsing HTML)
  - Axios (requêtes HTTP simples)
- **Cron Jobs** pour mises à jour automatiques
- **Queue System**: Bull/BullMQ pour gérer les tâches de scraping

---

## 🗂️ Structure de Projet Recommandée

```
whey-comparator/
├── frontend/                    # Application React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Composants shadcn/ui
│   │   │   ├── products/       # Composants liés aux produits
│   │   │   ├── comparison/     # Composants de comparaison
│   │   │   └── layout/         # Layout, Header, Footer
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Comparison.jsx
│   │   │   └── About.jsx
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API calls
│   │   ├── utils/              # Fonctions utilitaires
│   │   ├── contexts/           # React contexts
│   │   ├── types/              # TypeScript types
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                     # API Backend
│   ├── src/
│   │   ├── controllers/        # Logique métier
│   │   ├── models/             # Modèles de données
│   │   ├── routes/             # Routes API
│   │   ├── services/           # Services (scraping, etc.)
│   │   ├── middleware/         # Middlewares Express
│   │   ├── config/             # Configuration
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── scrapers/                    # Modules de scraping
│   ├── src/
│   │   ├── scrapers/
│   │   │   ├── myprotein.js
│   │   │   ├── prozis.js
│   │   │   ├── amazon.js
│   │   │   └── base-scraper.js
│   │   ├── utils/
│   │   ├── queue/              # Bull queue configuration
│   │   └── index.js
│   └── package.json
│
└── shared/                      # Code partagé
    ├── types/                   # Types TypeScript partagés
    └── constants/               # Constantes partagées
```

---

## 🗄️ Modèle de Données

### **Product**
```javascript
{
  id: string,
  name: string,
  brand: string,
  category: 'whey' | 'casein' | 'creatine' | 'bcaa' | 'other',
  type: string, // 'isolate', 'concentrate', 'blend'
  flavor: string,
  size: number, // en grammes
  servingSize: number,
  servingsPerContainer: number,
  nutritionFacts: {
    proteinPerServing: number,
    caloriesPerServing: number,
    fatPerServing: number,
    carbsPerServing: number,
    sugarPerServing: number
  },
  imageUrl: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### **Price**
```javascript
{
  id: string,
  productId: string,
  platform: 'myprotein' | 'prozis' | 'amazon' | 'bodybuilding',
  price: number,
  currency: 'EUR' | 'USD',
  url: string,
  inStock: boolean,
  lastChecked: timestamp,
  priceHistory: [
    {
      price: number,
      date: timestamp
    }
  ]
}
```

### **User** (optionnel, phase 2)
```javascript
{
  id: string,
  email: string,
  favorites: [productId],
  priceAlerts: [
    {
      productId: string,
      platform: string,
      targetPrice: number
    }
  ]
}
```

---

## 🚀 Feuille de Route (Roadmap)

### **Phase 1: Foundation (Semaines 1-2)**

#### Sprint 1.1 - Setup & Infrastructure
- [ ] Initialiser la structure backend (Express + PostgreSQL)
- [ ] Configurer Prisma/TypeORM pour l'ORM
- [ ] Créer les modèles de base de données
- [ ] Setup migrations
- [ ] Configurer les variables d'environnement
- [ ] Créer un Docker Compose pour dev (PostgreSQL + Redis)

#### Sprint 1.2 - API de Base
- [ ] Créer les routes CRUD pour Products
- [ ] Créer les routes CRUD pour Prices
- [ ] Implémenter la validation avec Zod
- [ ] Ajouter la documentation API (Swagger/OpenAPI)
- [ ] Créer des seeds de données pour le développement

#### Sprint 1.3 - Frontend Foundation
- [ ] Installer et configurer React Router
- [ ] Installer TanStack Query
- [ ] Configurer les services API (axios)
- [ ] Créer le layout principal (Header, Footer, Navigation)
- [ ] Implémenter les pages de base (Home, ProductList)

---

### **Phase 2: Data Collection (Semaines 3-5)**

#### Sprint 2.1 - Infrastructure de Scraping
- [ ] Créer la classe `BaseScraper` abstraite
- [ ] Implémenter la gestion des proxies (optionnel)
- [ ] Configurer Puppeteer avec pool de navigateurs
- [ ] Créer un système de retry avec exponential backoff
- [ ] Implémenter le logging (Winston)

#### Sprint 2.2 - Scrapers Individuels
- [ ] **MyProtein Scraper**
  - Parser les pages produits
  - Extraire prix, images, nutritions
  - Gérer la pagination
- [ ] **Prozis Scraper**
  - Même approche
- [ ] **Amazon Scraper**
  - Attention aux détections anti-bot
  - Utiliser l'API Product Advertising si possible

#### Sprint 2.3 - Queue & Automation
- [ ] Configurer Bull/BullMQ
- [ ] Créer les jobs de scraping
- [ ] Implémenter les cron jobs (mise à jour quotidienne)
- [ ] Dashboard Bull Board pour monitoring
- [ ] Système d'alertes en cas d'échec

#### Sprint 2.4 - Data Matching
- [ ] Algorithme de matching de produits similaires
  - Comparaison de noms (fuzzy matching)
  - Vérification de marque, taille, saveur
- [ ] Système de normalisation des données
- [ ] Détection de doublons

---

### **Phase 3: Core Features (Semaines 6-8)**

#### Sprint 3.1 - Product Display
- [ ] Page liste des produits avec filtres
  - Filtres: catégorie, marque, type, prix
  - Tri: prix, popularité, protéines/€
- [ ] Card produit avec infos essentielles
- [ ] Système de pagination ou infinite scroll
- [ ] Search bar avec autocomplétion

#### Sprint 3.2 - Product Detail Page
- [ ] Vue détaillée d'un produit
- [ ] Tableau comparatif des prix par plateforme
- [ ] Graphique d'historique des prix (Recharts)
- [ ] Informations nutritionnelles détaillées
- [ ] Bouton "Acheter" vers les plateformes

#### Sprint 3.3 - Comparison Feature
- [ ] Système de sélection multi-produits
- [ ] Page de comparaison côte à côte
- [ ] Tableau comparatif (prix, nutrition, ratio protéines/€)
- [ ] Export en PDF (optionnel)
- [ ] Partage de comparaison via URL

#### Sprint 3.4 - Price Intelligence
- [ ] Calcul du "meilleur rapport qualité/prix"
  - Prix par kg de protéines
  - Score basé sur nutrition + prix
- [ ] Badge "Meilleure offre" sur les cards
- [ ] Alertes de baisse de prix (email)

---

### **Phase 4: UX Enhancement (Semaines 9-10)**

#### Sprint 4.1 - Performance
- [ ] Implémenter le cache avec TanStack Query
- [ ] Lazy loading des images
- [ ] Code splitting par route
- [ ] Optimisation bundle size
- [ ] Service Worker pour offline (optionnel)

#### Sprint 4.2 - User Experience
- [ ] Dark mode
- [ ] Animations et transitions fluides
- [ ] États de chargement (skeletons)
- [ ] Gestion des erreurs utilisateur
- [ ] Toast notifications

#### Sprint 4.3 - Mobile Optimization
- [ ] Design responsive complet
- [ ] Touch gestures pour la comparaison
- [ ] Menu mobile optimisé
- [ ] PWA capabilities

---

### **Phase 5: Advanced Features (Semaines 11-12)**

#### Sprint 5.1 - User Accounts (optionnel)
- [ ] Authentification (Supabase Auth ou JWT)
- [ ] Profil utilisateur
- [ ] Liste de favoris
- [ ] Historique de recherches

#### Sprint 5.2 - Price Alerts
- [ ] Système d'alertes email
- [ ] Configuration des seuils de prix
- [ ] Notifications push (optionnel)

#### Sprint 5.3 - Analytics & SEO
- [ ] Intégration Google Analytics
- [ ] Meta tags optimisés
- [ ] Sitemap dynamique
- [ ] Structured data (JSON-LD)

---

## 🔧 Défis Techniques & Solutions

### **1. Scraping Challenges**

#### **Anti-Bot Detection**
- **Problème**: Sites protégés contre le scraping
- **Solutions**:
  - User-Agent rotation
  - Proxies résidentiels (BrightData, Oxylabs)
  - Playwright avec empreintes browser réalistes
  - Rate limiting intelligent
  - Scraping pendant heures creuses

#### **Structure HTML Variable**
- **Problème**: Sites changent leur HTML
- **Solutions**:
  - Sélecteurs CSS/XPath multiples (fallbacks)
  - Tests automatisés des scrapers
  - Système d'alertes si scraping échoue
  - Documentation des selectors dans le code

#### **JavaScript Rendering**
- **Problème**: Contenu chargé en JavaScript
- **Solutions**:
  - Puppeteer/Playwright (full browser)
  - Attente des éléments avec `waitForSelector`
  - Inspection des requêtes réseau (API directe)

### **2. Data Matching**

**Algorithme de Matching Recommandé**:
```javascript
function matchProducts(product1, product2) {
  const similarity = {
    brand: product1.brand === product2.brand ? 1 : 0,
    name: stringSimilarity(product1.name, product2.name),
    size: Math.abs(product1.size - product2.size) < 100 ? 1 : 0,
    flavor: product1.flavor === product2.flavor ? 1 : 0
  };
  
  const score = 
    similarity.brand * 0.3 +
    similarity.name * 0.4 +
    similarity.size * 0.2 +
    similarity.flavor * 0.1;
  
  return score > 0.7; // Threshold
}
```

### **3. Performance**

- **Cache Redis**: 
  - Cache des prix pendant 1h
  - Cache des listes de produits pendant 24h
- **CDN**: Cloudflare pour images et assets
- **Database Indexing**: 
  - Index sur `brand`, `category`, `price`
- **Pagination API**: Limite 20-50 produits par page

---

## 📦 Code Samples

### **Frontend: Product Card Component**

```jsx
// src/components/products/ProductCard.jsx
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product, prices }) {
  const lowestPrice = Math.min(...prices.map(p => p.price));
  const bestPlatform = prices.find(p => p.price === lowestPrice);
  
  const pricePerKgProtein = (
    lowestPrice / 
    (product.nutritionFacts.proteinPerServing * product.servingsPerContainer / 1000)
  ).toFixed(2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-48 object-cover rounded-md"
        />
        <h3 className="font-semibold mt-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600">{product.brand}</p>
        
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{product.type}</Badge>
          <Badge variant="outline">{product.size}g</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold text-green-600">
            {lowestPrice.toFixed(2)}€
          </p>
          <p className="text-xs text-gray-500">
            {pricePerKgProtein}€/kg de protéines
          </p>
        </div>
        
        <Link 
          to={`/products/${product.id}`}
          className="btn-primary"
        >
          Comparer
        </Link>
      </CardFooter>
    </Card>
  );
}
```

### **Backend: Scraper Base Class**

```javascript
// scrapers/src/scrapers/base-scraper.js
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

export class BaseScraper {
  constructor(platform) {
    this.platform = platform;
    this.browser = null;
    this.maxRetries = 3;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeWithRetry(url, scrapeFn, retries = this.maxRetries) {
    try {
      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0...');
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      const result = await scrapeFn(page);
      
      await page.close();
      return result;
    } catch (error) {
      logger.error(`Scraping failed for ${url}`, error);
      
      if (retries > 0) {
        logger.info(`Retrying... (${retries} attempts left)`);
        await this.sleep(2000);
        return this.scrapeWithRetry(url, scrapeFn, retries - 1);
      }
      
      throw error;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // À implémenter par les scrapers enfants
  async scrapeProduct(url) {
    throw new Error('scrapeProduct must be implemented');
  }
}
```

### **Backend: MyProtein Scraper**

```javascript
// scrapers/src/scrapers/myprotein.js
import { BaseScraper } from './base-scraper.js';

export class MyProteinScraper extends BaseScraper {
  constructor() {
    super('myprotein');
    this.baseUrl = 'https://www.myprotein.fr';
  }

  async scrapeProduct(url) {
    return this.scrapeWithRetry(url, async (page) => {
      // Attendre le chargement du prix
      await page.waitForSelector('.productPrice_price');

      const product = await page.evaluate(() => {
        const name = document.querySelector('h1.productName')?.textContent.trim();
        const price = document.querySelector('.productPrice_price')?.textContent
          .replace('€', '').replace(',', '.').trim();
        const image = document.querySelector('.athenaProductImageCarousel_image img')?.src;
        
        // Extraire les infos nutritionnelles
        const nutritionTable = document.querySelector('.athenaProductNutrition_table');
        const proteinRow = Array.from(nutritionTable?.querySelectorAll('tr') || [])
          .find(row => row.textContent.includes('Protéines'));
        const protein = proteinRow?.querySelector('td')?.textContent.trim();

        return {
          name,
          price: parseFloat(price),
          imageUrl: image,
          proteinPerServing: parseFloat(protein)
        };
      });

      return product;
    });
  }

  async scrapeCategory(categoryUrl) {
    const products = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `${categoryUrl}?page=${page}`;
      const pageProducts = await this.scrapeProductList(url);
      
      products.push(...pageProducts);
      hasMore = pageProducts.length > 0;
      page++;
    }

    return products;
  }

  async scrapeProductList(url) {
    return this.scrapeWithRetry(url, async (page) => {
      await page.waitForSelector('.productListProducts_product');

      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('.productListProducts_product');
        return Array.from(items).map(item => ({
          name: item.querySelector('.productCard_productName')?.textContent.trim(),
          url: item.querySelector('a')?.href,
          price: parseFloat(
            item.querySelector('.productPrice_price')?.textContent
              .replace('€', '').replace(',', '.').trim()
          )
        }));
      });

      return products;
    });
  }
}
```

---

## 🧪 Testing Strategy

### **Frontend Tests**
- **Unit**: Components avec Vitest + React Testing Library
- **Integration**: User flows avec Playwright
- **E2E**: Scénarios critiques (recherche → comparaison → achat)

### **Backend Tests**
- **Unit**: Services et utilities avec Jest
- **Integration**: Routes API avec Supertest
- **Scrapers**: Mocked responses + tests sur des pages HTML statiques

---

## 🚢 Deployment

### **Recommandation**

#### **Frontend**
- **Vercel** ou **Netlify** (déploiement automatique depuis GitHub)
- Build optimisé avec Vite
- Variables d'env pour l'API URL

#### **Backend**
- **Railway** ou **Render** (PostgreSQL inclus)
- Cron jobs pour scraping
- Redis pour cache

#### **Alternative Cloud**
- **AWS**: EC2 + RDS + ElastiCache + EventBridge (cron)
- **Google Cloud**: Cloud Run + Cloud SQL + Memorystore

---

## 📊 Métriques de Succès

- **Performance**: Temps de chargement < 2s
- **Data Freshness**: Prix mis à jour toutes les 24h
- **Coverage**: Au moins 3 plateformes scrapées
- **Accuracy**: 95%+ de matching correct entre produits
- **Uptime**: 99% pour l'API

---

## 🔒 Considérations Légales

⚠️ **Important**: Le scraping peut violer les CGU des sites. Considérer:
- APIs officielles quand disponibles (Amazon Product API)
- Partenariats d'affiliation
- Rate limiting respectueux
- Mention légale sur l'origine des données

---

## 📚 Resources & Tools

### **Libraries Clés**
- **Frontend**: React Router, TanStack Query, Recharts, React Hook Form
- **Backend**: Express, Prisma, Bull, Puppeteer
- **Dev**: Vitest, Playwright, ESLint, Prettier

### **Services Externes**
- **Scraping Proxies**: BrightData, ScraperAPI
- **Email**: SendGrid, Resend
- **Monitoring**: Sentry, LogRocket

---

## 🎯 Quick Start Commands

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup
cd frontend
npm install
npm run dev

# Scrapers
cd scrapers
npm install
npm run scrape:myprotein
```

---

**Prochaines étapes recommandées:**
1. Setup du backend avec Prisma + PostgreSQL
2. Création du premier scraper (MyProtein)
3. API endpoint `/products` avec filtres
4. Interface produit de base avec React Query

Bonne chance avec Whey-Comparator! 🚀
