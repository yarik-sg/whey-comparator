import type {
  ApiPrice,
  ComparisonEntry,
  ComparisonResponse,
  DealItem,
  ProductOffersResponse,
  ProductSummary,
  RelatedProductsResponse,
  ScraperOffer,
} from "@/types/api";

const DEFAULT_CURRENCY = "EUR";
const formatterCache = new Map<string, Intl.NumberFormat>();

function formatCurrency(amount: number, currency: string) {
  const normalizedCurrency = currency?.toUpperCase() || DEFAULT_CURRENCY;
  let formatter = formatterCache.get(normalizedCurrency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    });
    formatterCache.set(normalizedCurrency, formatter);
  }
  return formatter.format(amount);
}

type RawFallbackOffer = {
  id: string;
  title?: string;
  vendor: string;
  price: number;
  currency?: string;
  shippingCost?: number;
  shippingText?: string;
  inStock?: boolean;
  stockStatus?: string;
  link?: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  source?: string;
};

type RawFallbackProduct = {
  id: number;
  name: string;
  brand?: string;
  flavour?: string;
  category?: string;
  image?: string;
  weightKg?: number;
  proteinPerServing?: number;
  servingSize?: number;
  rating?: number;
  reviewsCount?: number;
  offers: RawFallbackOffer[];
};

type FallbackDealEntry = {
  product: RawFallbackProduct;
  deals: DealItem[];
};

const RAW_FALLBACK_PRODUCTS: RawFallbackProduct[] = [
  {
    id: 101,
    name: "Impact Whey Isolate 1 kg",
    brand: "MyProtein",
    flavour: "Vanille",
    category: "whey-protein",
    image: "https://images.unsplash.com/photo-1586402187872-4ebc2c4f7caf?auto=format&fit=crop&w=600&q=80",
    weightKg: 1,
    proteinPerServing: 23,
    servingSize: 25,
    rating: 4.7,
    reviewsCount: 1984,
    offers: [
      {
        id: "mp-impact-vanilla",
        title: "Impact Whey Isolate 1 kg",
        vendor: "MyProtein",
        price: 29.99,
        currency: "EUR",
        shippingCost: 4.99,
        shippingText: "Livraison 4,99 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.myprotein.fr/sports-nutrition/impact-whey-isolate/10852501.html",
        image: "https://images.unsplash.com/photo-1526402467855-1d8db87a98e7?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 1523,
        source: "Catalogue interne",
      },
      {
        id: "amazon-impact-vanilla",
        title: "Impact Whey Isolate 1 kg",
        vendor: "Amazon",
        price: 32.49,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B00PYX0K5W",
        image: "https://images.unsplash.com/photo-1598966733525-05cbe7d5ac26?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 1984,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 201,
    name: "Créatine Monohydrate 500 g",
    brand: "MyProtein",
    flavour: "Sans arôme",
    category: "creatine",
    image: "https://images.unsplash.com/photo-1554281323-00acb8ab272c?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.5,
    rating: 4.8,
    reviewsCount: 1572,
    offers: [
      {
        id: "mp-creatine-500",
        title: "Créatine Monohydrate 500 g",
        vendor: "MyProtein",
        price: 19.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.myprotein.fr/sports-nutrition/creatine-monohydrate/10530049.html",
        image: "https://images.unsplash.com/photo-1600180758890-6ffbe47b9791?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 1572,
        source: "Catalogue interne",
      },
      {
        id: "amazon-creatine-500",
        title: "Créatine Monohydrate Micronisée 500 g",
        vendor: "Amazon",
        price: 21.9,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B00U2DGKOK",
        image: "https://images.unsplash.com/photo-1600180759234-775ad1c9c1d0?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 893,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 202,
    name: "Créatine Creapure 1 kg",
    brand: "Nutrimuscle",
    flavour: "Pure",
    category: "creatine",
    image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=600&q=80",
    weightKg: 1,
    rating: 4.9,
    reviewsCount: 624,
    offers: [
      {
        id: "nutrimuscle-creapure-1kg",
        title: "Créatine Creapure 1 kg",
        vendor: "Nutrimuscle",
        price: 39.95,
        currency: "EUR",
        shippingCost: 4.5,
        shippingText: "Livraison 4,50 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.nutrimuscle.com/products/creatine-creapure",
        image: "https://images.unsplash.com/photo-1600181958890-3e5cf72d23b2?auto=format&fit=crop&w=600&q=80",
        rating: 4.9,
        reviewsCount: 624,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-creapure-1kg",
        title: "Créatine Monohydrate Qualité Creapure",
        vendor: "Decathlon",
        price: 42.9,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/creatine-monohydrate-1kg/_/R-p-X8752369",
        image: "https://images.unsplash.com/photo-1594737625785-c66858a7220b?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 312,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 301,
    name: "BCAA 2:1:1 Instant 400 g",
    brand: "Scitec Nutrition",
    flavour: "Fruit punch",
    category: "bcaa",
    image: "https://images.unsplash.com/photo-1543364195-bfe6e4932397?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.4,
    rating: 4.6,
    reviewsCount: 784,
    offers: [
      {
        id: "scitec-bcaa-400",
        title: "BCAA 2:1:1 Instant 400 g",
        vendor: "Scitec",
        price: 26.9,
        currency: "EUR",
        shippingCost: 3.5,
        shippingText: "Livraison 3,50 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://shop.scitecnutrition.com/products/bcaa-211",
        image: "https://images.unsplash.com/photo-1549068106-b024baf5062d?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 784,
        source: "Catalogue interne",
      },
      {
        id: "amazon-bcaa-400",
        title: "BCAA 2:1:1 Poudre 400 g",
        vendor: "Amazon",
        price: 28.5,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B07F73K6BD",
        image: "https://images.unsplash.com/photo-1576402187872-4ebc2c4f7caf?auto=format&fit=crop&w=600&q=80",
        rating: 4.5,
        reviewsCount: 512,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 302,
    name: "EAA Complex 300 g",
    brand: "MyProtein",
    flavour: "Framboise",
    category: "bcaa",
    image: "https://images.unsplash.com/photo-1578874474078-7fc9b3cbd1d9?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.3,
    rating: 4.4,
    reviewsCount: 436,
    offers: [
      {
        id: "mp-eaa-300",
        title: "EAA Essential Aminos 300 g",
        vendor: "MyProtein",
        price: 24.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.myprotein.fr/sports-nutrition/essential-amino-acids-eaa/11996515.html",
        image: "https://images.unsplash.com/photo-1541622247800-9d1c37f3a610?auto=format&fit=crop&w=600&q=80",
        rating: 4.4,
        reviewsCount: 436,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-eaa-300",
        title: "Acides aminés essentiels 300 g",
        vendor: "Decathlon",
        price: 26.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/amino-essentiels-300g/_/R-p-X8795314",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        rating: 4.3,
        reviewsCount: 188,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 401,
    name: "Pré-workout Nitro X 300 g",
    brand: "Impact Nutrition",
    flavour: "Tropical",
    category: "preworkout",
    image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.3,
    rating: 4.5,
    reviewsCount: 512,
    offers: [
      {
        id: "impact-nitro-300",
        title: "Pré-workout Nitro X 300 g",
        vendor: "Impact Nutrition",
        price: 29.9,
        currency: "EUR",
        shippingCost: 4.5,
        shippingText: "Livraison 4,50 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.impact-nutrition.fr/pre-workout-nitro-x",
        image: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=600&q=80",
        rating: 4.5,
        reviewsCount: 512,
        source: "Catalogue interne",
      },
      {
        id: "amazon-preworkout-nitro",
        title: "Pre-workout Booster Nitro 300 g",
        vendor: "Amazon",
        price: 31.5,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B07QXM7J2T",
        image: "https://images.unsplash.com/photo-1584270354949-1c6131cba5b5?auto=format&fit=crop&w=600&q=80",
        rating: 4.4,
        reviewsCount: 276,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 402,
    name: "Pré-workout Pump Shot 500 g",
    brand: "Prozis",
    flavour: "Cassis",
    category: "preworkout",
    image: "https://images.unsplash.com/photo-1600180758890-6ffbe47b9791?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.5,
    rating: 4.3,
    reviewsCount: 341,
    offers: [
      {
        id: "prozis-pump-500",
        title: "Pré-workout Pump Shot 500 g",
        vendor: "Prozis",
        price: 34.99,
        currency: "EUR",
        shippingCost: 4.99,
        shippingText: "Livraison 4,99 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.prozis.com/fr/fr/prozis/pump-shot-500g",
        image: "https://images.unsplash.com/photo-1544827399-10c2d3fd0e41?auto=format&fit=crop&w=600&q=80",
        rating: 4.3,
        reviewsCount: 341,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-pump-500",
        title: "Booster pré-workout 500 g",
        vendor: "Decathlon",
        price: 36.9,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/booster-pre-workout-500g/_/R-p-X8752214",
        image: "https://images.unsplash.com/photo-1594737625785-c66858a7220b?auto=format&fit=crop&w=600&q=80",
        rating: 4.2,
        reviewsCount: 198,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 501,
    name: "Ceinture de musculation en cuir",
    brand: "Rogue",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1600180759100-7df37f1acc55?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviewsCount: 412,
    offers: [
      {
        id: "rogue-belt",
        title: "Ceinture de musculation en cuir",
        vendor: "Rogue",
        price: 69.9,
        currency: "EUR",
        shippingCost: 9.9,
        shippingText: "Livraison 9,90 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.rogueeurope.eu/rogue-13mm-powerlifting-belt-eu",
        image: "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 412,
        source: "Catalogue interne",
      },
      {
        id: "amazon-belt",
        title: "Ceinture lestée haltérophilie",
        vendor: "Amazon",
        price: 64.5,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "Expédié sous 24h",
        link: "https://www.amazon.fr/dp/B07L4G9Y3K",
        image: "https://images.unsplash.com/photo-1612392061265-5e72c6f1cf7e?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 283,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 502,
    name: "Sangles de tirage heavy duty",
    brand: "Eleiko",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1541613568893-47846c16c77b?auto=format&fit=crop&w=600&q=80",
    rating: 4.5,
    reviewsCount: 294,
    offers: [
      {
        id: "eleiko-straps",
        title: "Sangles de tirage heavy duty",
        vendor: "Eleiko",
        price: 24.9,
        currency: "EUR",
        shippingCost: 5.9,
        shippingText: "Livraison 5,90 €",
        inStock: true,
        stockStatus: "En stock",
        link: "https://shop.eleiko.com/products/weightlifting-straps",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        rating: 4.5,
        reviewsCount: 294,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-straps",
        title: "Sangles de tirage cross-training",
        vendor: "Decathlon",
        price: 19.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/straps-musculation/_/R-p-X8409146",
        image: "https://images.unsplash.com/photo-1614697960260-76d5f4fec6b7?auto=format&fit=crop&w=600&q=80",
        rating: 4.4,
        reviewsCount: 198,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 601,
    name: "T-shirt technique respirant homme",
    brand: "Nike",
    category: "apparel",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
    reviewsCount: 958,
    offers: [
      {
        id: "nike-pro-tee",
        title: "T-shirt Nike Pro Dri-FIT",
        vendor: "Nike",
        price: 34.99,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison offerte",
        inStock: true,
        stockStatus: "Disponible",
        link: "https://www.nike.com/fr/t/t-shirt-dentrainement-nike-pro-dri-fit",
        image: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 958,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-nike-pro",
        title: "T-shirt technique training homme",
        vendor: "Decathlon",
        price: 29.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/t-shirt-cardio-fitness-homme/_/R-p-332396",
        image: "https://images.unsplash.com/photo-1600180758890-6ffbe47b9791?auto=format&fit=crop&w=600&q=80",
        rating: 4.5,
        reviewsCount: 421,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 602,
    name: "Legging de compression femme",
    brand: "Under Armour",
    category: "apparel",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
    reviewsCount: 742,
    offers: [
      {
        id: "ua-heatgear-legging",
        title: "Legging Under Armour HeatGear",
        vendor: "Under Armour",
        price: 44.99,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison offerte",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.underarmour.fr/fr-fr/p/bottoms/heatgear-leggings/1344522.html",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        rating: 4.7,
        reviewsCount: 742,
        source: "Catalogue interne",
      },
      {
        id: "decathlon-ua-legging",
        title: "Legging cardio training femme",
        vendor: "Decathlon",
        price: 39.99,
        currency: "EUR",
        shippingCost: 3.99,
        shippingText: "Livraison 3,99 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/legging-femme-fitness-cardio/_/R-p-325872",
        image: "https://images.unsplash.com/photo-1544473244-fc3686c71fa0?auto=format&fit=crop&w=600&q=80",
        rating: 4.6,
        reviewsCount: 318,
        source: "SerpAPI",
      },
    ],
  },
  {
    id: 102,
    name: "100% Whey Gold Standard 908 g",
    brand: "Optimum Nutrition",
    flavour: "Double chocolat",
    category: "whey-protein",
    image: "https://images.unsplash.com/photo-1517638851339-4aa32003c11a?auto=format&fit=crop&w=600&q=80",
    weightKg: 0.908,
    proteinPerServing: 24,
    servingSize: 30,
    rating: 4.8,
    reviewsCount: 842,
    offers: [
      {
        id: "decathlon-gold-standard",
        title: "Whey Gold Standard 908 g",
        vendor: "Decathlon",
        price: 39.99,
        currency: "EUR",
        shippingCost: 4.5,
        shippingText: "Livraison 4,50 €",
        inStock: true,
        stockStatus: "Disponible en magasin",
        link: "https://www.decathlon.fr/p/whey-gold-standard-908g/_/R-p-X8735034",
        image: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 421,
        source: "Catalogue interne",
      },
      {
        id: "amazon-gold-standard",
        title: "Optimum Nutrition Gold Standard Whey 908 g",
        vendor: "Amazon",
        price: 42.9,
        currency: "EUR",
        shippingCost: 0,
        shippingText: "Livraison gratuite Prime",
        inStock: true,
        stockStatus: "En stock",
        link: "https://www.amazon.fr/dp/B002DYIZEO",
        image: "https://images.unsplash.com/photo-1486225068466-1a1574128861?auto=format&fit=crop&w=600&q=80",
        rating: 4.8,
        reviewsCount: 842,
        source: "SerpAPI",
      },
    ],
  },
];

function formatPrice(amount: number | null | undefined, currency = DEFAULT_CURRENCY): ApiPrice {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    return {
      amount: rounded,
      currency,
      formatted: formatCurrency(rounded, currency),
    };
  }

  return {
    amount: null,
    currency,
    formatted: null,
  };
}

function clonePrice(price: ApiPrice | null | undefined): ApiPrice | null {
  if (!price) {
    return null;
  }

  return {
    amount: price.amount ?? null,
    currency: price.currency ?? null,
    formatted: price.formatted ?? null,
  };
}

function cloneDeal(deal: DealItem): DealItem {
  return {
    ...deal,
    price: clonePrice(deal.price) ?? formatPrice(null, deal.price.currency ?? DEFAULT_CURRENCY),
    totalPrice: deal.totalPrice ? clonePrice(deal.totalPrice) : null,
    shippingCost: deal.shippingCost ?? null,
    shippingText: deal.shippingText ?? null,
    inStock: deal.inStock ?? null,
    stockStatus: deal.stockStatus ?? null,
    link: deal.link ?? null,
    image: deal.image ?? null,
    rating: deal.rating ?? null,
    reviewsCount: deal.reviewsCount ?? null,
    bestPrice: deal.bestPrice ?? false,
    isBestPrice: deal.isBestPrice ?? false,
    source: deal.source,
    productId: deal.productId ?? null,
    expiresAt: deal.expiresAt ?? null,
    weightKg: deal.weightKg ?? null,
    pricePerKg: deal.pricePerKg ?? null,
  };
}

const FALLBACK_DEAL_ENTRIES: FallbackDealEntry[] = RAW_FALLBACK_PRODUCTS.map((product) => {
  const offers = product.offers.map((offer) => buildOffer(offer, product));
  const bestOffer = markBestOffer(offers);

  const deals = offers.map((offer) => {
    const cloned = cloneDeal(offer);
    if (bestOffer && offer.id === bestOffer.id) {
      cloned.bestPrice = true;
      cloned.isBestPrice = true;
    }
    return cloned;
  });

  return { product, deals } satisfies FallbackDealEntry;
});

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}

function matchesFallbackQuery(product: RawFallbackProduct, deal: DealItem, query: string): boolean {
  if (!query) {
    return true;
  }

  const normalized = normalizeForSearch(query)
    .split(/\s+/)
    .filter(Boolean);

  if (normalized.length === 0) {
    return true;
  }

  const haystack = [
    product.name,
    product.brand,
    product.category,
    deal.title,
    deal.vendor,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => normalizeForSearch(value))
    .join(" ");

  return normalized.every((token) => haystack.includes(token));
}

export function getFallbackDeals({
  limit,
  query,
}: { limit?: number; query?: string } = {}): DealItem[] {
  const resolvedLimit = typeof limit === "number" && limit > 0 ? limit : Infinity;
  const filtered: DealItem[] = [];

  for (const entry of FALLBACK_DEAL_ENTRIES) {
    for (const deal of entry.deals) {
      if (query && !matchesFallbackQuery(entry.product, deal, query)) {
        continue;
      }

      filtered.push(cloneDeal(deal));

      if (filtered.length >= resolvedLimit) {
        return filtered;
      }
    }
  }

  if (filtered.length > 0) {
    return filtered;
  }

  const fallbackPool = FALLBACK_DEAL_ENTRIES.flatMap((entry) => entry.deals);
  const limited = fallbackPool.slice(0, resolvedLimit === Infinity ? undefined : resolvedLimit);
  return limited.map((deal) => cloneDeal(deal));
}

function cloneProduct(product: ProductSummary): ProductSummary {
  return {
    ...product,
    bestPrice: clonePrice(product.bestPrice) ?? formatPrice(null),
    totalPrice: product.totalPrice ? clonePrice(product.totalPrice) : null,
    bestDeal: product.bestDeal ? cloneDeal(product.bestDeal) : null,
    proteinPerEuro: product.proteinPerEuro ?? null,
    pricePerKg: product.pricePerKg ?? null,
    inStock: product.inStock ?? null,
    stockStatus: product.stockStatus ?? null,
    rating: product.rating ?? null,
    reviewsCount: product.reviewsCount ?? null,
    bestVendor: product.bestVendor ?? null,
    link: product.link ?? null,
  };
}

function buildOffer(rawOffer: RawFallbackOffer, product: RawFallbackProduct): DealItem {
  const currency = rawOffer.currency ?? DEFAULT_CURRENCY;
  const basePrice = formatPrice(rawOffer.price, currency);
  const totalAmount =
    typeof rawOffer.shippingCost === "number"
      ? rawOffer.price + rawOffer.shippingCost
      : rawOffer.price;
  const totalPrice =
    typeof totalAmount === "number" && Number.isFinite(totalAmount)
      ? formatPrice(totalAmount, currency)
      : null;

  const weightKg = product.weightKg ?? null;
  const pricePerKg =
    weightKg && totalAmount
      ? Math.round(((totalAmount / weightKg) + Number.EPSILON) * 100) / 100
      : null;

  return {
    id: rawOffer.id,
    title: rawOffer.title ?? rawOffer.vendor,
    vendor: rawOffer.vendor,
    price: basePrice,
    totalPrice,
    shippingCost:
      typeof rawOffer.shippingCost === "number" ? rawOffer.shippingCost : null,
    shippingText: rawOffer.shippingText ?? null,
    inStock: rawOffer.inStock ?? null,
    stockStatus: rawOffer.stockStatus ?? null,
    link: rawOffer.link ?? null,
    image: rawOffer.image ?? null,
    rating: rawOffer.rating ?? null,
    reviewsCount: rawOffer.reviewsCount ?? null,
    bestPrice: false,
    isBestPrice: false,
    source: rawOffer.source ?? rawOffer.vendor,
    productId: product.id,
    expiresAt: null,
    weightKg,
    pricePerKg,
  };
}

function getTotalAmount(offer: DealItem): number {
  const total = offer.totalPrice?.amount ?? offer.price.amount;
  if (typeof total === "number" && Number.isFinite(total)) {
    return total;
  }
  return Number.POSITIVE_INFINITY;
}

function markBestOffer(offers: DealItem[]): DealItem | null {
  let best: DealItem | null = null;
  let bestAmount = Number.POSITIVE_INFINITY;

  for (const offer of offers) {
    const amount = getTotalAmount(offer);
    if (amount < bestAmount) {
      best = offer;
      bestAmount = amount;
    }
  }

  if (best) {
    best.bestPrice = true;
    best.isBestPrice = true;
  }

  return best;
}

function buildProduct(
  product: RawFallbackProduct,
  offers: DealItem[],
  bestOffer: DealItem | null,
): ProductSummary {
  const bestPrice = clonePrice(bestOffer?.totalPrice ?? bestOffer?.price) ?? formatPrice(null);
  const totalPrice = clonePrice(bestOffer?.totalPrice);
  const bestDeal = bestOffer ? cloneDeal(bestOffer) : null;

  const weightKg = product.weightKg ?? null;
  const proteinPerServing = product.proteinPerServing ?? null;
  const servingSize = product.servingSize ?? null;

  let proteinPerEuro: number | null = null;
  const referenceAmount =
    (bestDeal?.totalPrice?.amount ?? bestDeal?.price.amount ?? bestPrice.amount) ?? null;

  if (
    typeof proteinPerServing === "number" &&
    typeof servingSize === "number" &&
    servingSize > 0 &&
    typeof weightKg === "number" &&
    weightKg > 0 &&
    typeof referenceAmount === "number" &&
    referenceAmount > 0
  ) {
    const servings = (weightKg * 1000) / servingSize;
    const totalProtein = servings * proteinPerServing;
    proteinPerEuro = Math.round(((totalProtein / referenceAmount) + Number.EPSILON) * 100) / 100;
  }

  const pricePerKg =
    typeof weightKg === "number" && weightKg > 0 && typeof referenceAmount === "number"
      ? Math.round(((referenceAmount / weightKg) + Number.EPSILON) * 100) / 100
      : null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand ?? null,
    flavour: product.flavour ?? null,
    category: product.category ?? null,
    image: product.image ?? null,
    image_url: product.image ?? null,
    bestPrice,
    totalPrice,
    bestDeal,
    offersCount: offers.length,
    inStock: bestOffer?.inStock ?? null,
    stockStatus: bestOffer?.stockStatus ?? null,
    rating: product.rating ?? bestOffer?.rating ?? null,
    reviewsCount: product.reviewsCount ?? bestOffer?.reviewsCount ?? null,
    proteinPerEuro,
    protein_per_serving_g: proteinPerServing,
    serving_size_g: servingSize,
    pricePerKg,
    bestVendor: bestOffer?.vendor ?? null,
    link: bestOffer?.link ?? null,
  };
}

function buildEntry(product: RawFallbackProduct): ComparisonEntry {
  const offers = product.offers.map((offer) => buildOffer(offer, product));
  const bestOffer = markBestOffer(offers);
  const summary = buildProduct(product, offers, bestOffer);

  return {
    product: summary,
    offers,
  };
}

function buildScraperOffers(product: RawFallbackProduct): ScraperOffer[] {
  const timestamp = new Date().toISOString();

  return product.offers.map((rawOffer, index) => {
    return {
      id: index + 1,
      source: rawOffer.source ?? rawOffer.vendor,
      url: rawOffer.link ?? "",
      price: rawOffer.price,
      currency: rawOffer.currency ?? DEFAULT_CURRENCY,
      price_per_100g_protein: null,
      stock_status: rawOffer.stockStatus ?? null,
      in_stock: rawOffer.inStock ?? null,
      shipping_cost: rawOffer.shippingCost ?? null,
      shipping_text: rawOffer.shippingText ?? null,
      last_checked: timestamp,
    } satisfies ScraperOffer;
  });
}

function buildSummary(offers: DealItem[]): DealItem[] {
  const sorted = offers
    .slice()
    .sort((a, b) => getTotalAmount(a) - getTotalAmount(b));

  return sorted.slice(0, Math.min(sorted.length, 5)).map((offer, index) => {
    const cloned = cloneDeal(offer);
    if (index === 0) {
      cloned.bestPrice = true;
      cloned.isBestPrice = true;
    }
    return cloned;
  });
}

function normalizeIds(ids: readonly string[]): number[] {
  const normalized = new Set<number>();

  ids.forEach((value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      normalized.add(parsed);
    }
  });

  return Array.from(normalized);
}

export function getFallbackProductSummaries(limit?: number): ProductSummary[] {
  const resolvedLimit = typeof limit === "number" && limit > 0 ? limit : RAW_FALLBACK_PRODUCTS.length;
  return RAW_FALLBACK_PRODUCTS.slice(0, resolvedLimit).map((product) => {
    const entry = buildEntry(product);
    return cloneProduct(entry.product);
  });
}

export function getFallbackProductOffers(productId: number): ProductOffersResponse | null {
  const product = RAW_FALLBACK_PRODUCTS.find((item) => item.id === productId);
  if (!product) {
    return null;
  }

  const entry = buildEntry(product);
  const offers = entry.offers.map((offer) => cloneDeal(offer));

  return {
    product: cloneProduct(entry.product),
    offers,
    sources: {
      scraper: buildScraperOffers(product),
    },
  } satisfies ProductOffersResponse;
}

function scoreRelatedProduct(
  base: RawFallbackProduct,
  candidate: RawFallbackProduct,
): number {
  let score = 0;

  if (base.brand && candidate.brand && base.brand === candidate.brand) {
    score += 2;
  }

  if (base.category && candidate.category && base.category === candidate.category) {
    score += 1;
  }

  if (typeof candidate.rating === "number") {
    score += Math.min(candidate.rating / 5, 1);
  }

  return score;
}

export function getFallbackRelatedProducts(
  productId: number,
  limit = 4,
): RelatedProductsResponse | null {
  const baseProduct = RAW_FALLBACK_PRODUCTS.find((item) => item.id === productId);

  if (!baseProduct) {
    return null;
  }

  const candidates = RAW_FALLBACK_PRODUCTS.filter((item) => item.id !== productId).map((item) => ({
    product: item,
    score: scoreRelatedProduct(baseProduct, item),
  }));

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.product.name.localeCompare(b.product.name, "fr", { sensitivity: "base" });
  });

  const selected = candidates.slice(0, Math.max(limit, 0)).map(({ product }) => {
    const entry = buildEntry(product);
    return cloneProduct(entry.product);
  });

  return {
    productId,
    related: selected,
  } satisfies RelatedProductsResponse;
}

export function getFallbackComparison(ids: readonly string[]): ComparisonResponse | null {
  const normalizedIds = normalizeIds(ids);
  if (normalizedIds.length === 0) {
    return null;
  }

  const entries = normalizedIds
    .map((id) => RAW_FALLBACK_PRODUCTS.find((product) => product.id === id))
    .filter((product): product is RawFallbackProduct => Boolean(product))
    .map((product) => buildEntry(product));

  if (entries.length === 0) {
    return null;
  }

  const summaryOffers = buildSummary(entries.flatMap((entry) => entry.offers));

  return {
    products: entries.map((entry) => ({
      product: cloneProduct(entry.product),
      offers: entry.offers.map((offer) => cloneDeal(offer)),
    })),
    summary: summaryOffers,
  };
}

export function getFallbackIds(): string[] {
  return RAW_FALLBACK_PRODUCTS.map((product) => String(product.id));
}
