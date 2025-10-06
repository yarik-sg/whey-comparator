export type ProductType = 'whey' | 'creatine';

export interface Product {
  id: string;
  name: string;
  brand: string;
  type: ProductType;
  imageUrl?: string;
  imageAlt?: string;
  price: number; // €
  originalPrice: number; // €
  discountRate: number; // 0-1
  promotionEndsAt: string | null; // ISO date
  badges: string[];
  sizeGrams: number;
  proteinPerServing: number; // g
  creatinePerServing?: number; // g
  servings: number;
  flavor: string;
  rating: number; // 0-5
  link?: string;
}

export const products: Product[] = [
  {
    id: 'iso-elite-vanilla',
    name: 'Iso Elite Vanilla',
    brand: 'NutriFuel',
    type: 'whey',
    imageUrl:
      'https://images.unsplash.com/photo-1586380837285-307d1fdfa4b4?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Sachet de whey protéine Iso Elite saveur vanille',
    price: 39.9,
    originalPrice: 49.9,
    discountRate: 0.2,
    promotionEndsAt: '2024-06-30T21:59:59.000Z',
    badges: ['Best-seller', 'Sans lactose'],
    sizeGrams: 900,
    proteinPerServing: 27,
    servings: 30,
    flavor: 'Vanille',
    rating: 4.6,
    link: '#',
  },
  {
    id: 'power-whey-choco',
    name: 'Power Whey Choco',
    brand: 'PureForce',
    type: 'whey',
    imageUrl:
      'https://images.unsplash.com/photo-1547514701-42782101795d?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Pot de whey chocolat Power Whey',
    price: 54.9,
    originalPrice: 64.9,
    discountRate: 0.154,
    promotionEndsAt: '2024-07-15T21:59:59.000Z',
    badges: ['-15 % immédiat', 'Edition limitée'],
    sizeGrams: 2000,
    proteinPerServing: 24,
    servings: 66,
    flavor: 'Chocolat',
    rating: 4.8,
    link: '#',
  },
  {
    id: 'grass-fed-strawberry',
    name: 'Grass-Fed Strawberry',
    brand: 'Alpine Nutrition',
    type: 'whey',
    imageUrl:
      'https://images.unsplash.com/photo-1586401100295-7a8096fd2315?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Sachet de whey Grass-Fed saveur fraise',
    price: 44.5,
    originalPrice: 44.5,
    discountRate: 0,
    promotionEndsAt: null,
    badges: ['Lait d’herbage'],
    sizeGrams: 1500,
    proteinPerServing: 25,
    servings: 50,
    flavor: 'Fraise',
    rating: 4.7,
    link: '#',
  },
  {
    id: 'creapure-performance',
    name: 'Creapure Performance',
    brand: 'PureForce',
    type: 'creatine',
    imageUrl:
      'https://images.unsplash.com/photo-1585386959984-a4155223f96d?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Boîte de créatine Creapure Performance',
    price: 24.9,
    originalPrice: 29.9,
    discountRate: 0.167,
    promotionEndsAt: '2024-05-31T21:59:59.000Z',
    badges: ['Qualité pharmaceutique'],
    sizeGrams: 500,
    proteinPerServing: 0,
    creatinePerServing: 5,
    servings: 100,
    flavor: 'Neutre',
    rating: 4.9,
    link: '#',
  },
  {
    id: 'micronized-creatine',
    name: 'Micronized Creatine',
    brand: 'NutriFuel',
    type: 'creatine',
    imageUrl:
      'https://images.unsplash.com/photo-1600180758890-6f05512d4d6c?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Pot de poudre de créatine micronisée',
    price: 18.5,
    originalPrice: 18.5,
    discountRate: 0,
    promotionEndsAt: null,
    badges: ['Micronisation avancée'],
    sizeGrams: 300,
    proteinPerServing: 0,
    creatinePerServing: 5,
    servings: 60,
    flavor: 'Neutre',
    rating: 4.5,
    link: '#',
  },
  {
    id: 'vegan-whey-mix',
    name: 'Vegan Whey Mix',
    brand: 'GreenLab',
    type: 'whey',
    imageUrl:
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
    imageAlt: 'Shaker de whey végétale Vegan Whey Mix',
    price: 32.0,
    originalPrice: 36.0,
    discountRate: 0.111,
    promotionEndsAt: '2024-06-10T21:59:59.000Z',
    badges: ['Vegan', 'Sans soja'],
    sizeGrams: 1000,
    proteinPerServing: 23,
    servings: 33,
    flavor: 'Cookies',
    rating: 4.2,
    link: '#',
  },
];

export interface HighlightedDeal {
  id: string;
  productId: string;
  tagline: string;
  description: string;
  ctaLabel: string;
}

export const highlightedDeals: HighlightedDeal[] = [
  {
    id: 'deal-iso-elite',
    productId: 'iso-elite-vanilla',
    tagline: '20 % de réduction immédiate',
    description:
      "Iso whey filtrée à froid, idéale après l'entraînement pour une digestion rapide sans lactose.",
    ctaLabel: 'Voir la promo',
  },
  {
    id: 'deal-creapure',
    productId: 'creapure-performance',
    tagline: 'Créatine Creapure certifiée',
    description:
      "Profitez d'une remise spéciale sur la créatine Creapure, contrôlée pour une pureté maximale.",
    ctaLabel: 'Profiter de l’offre',
  },
  {
    id: 'deal-vegan-mix',
    productId: 'vegan-whey-mix',
    tagline: 'Pack vegan -11 %',
    description:
      'Formule végétale complète, enrichie en acides aminés essentiels et sans soja.',
    ctaLabel: 'Découvrir le mélange',
  },
];
