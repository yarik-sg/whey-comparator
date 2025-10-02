export interface Deal {
  id: string;
  productName: string;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  hook: string;
  deadline?: string;
  badge?: string;
  color?: string;
  ctaLabel?: string;
  imageUrl: string;
  imageAlt: string;
  bestPrice: boolean;
  rating: number;
  reviewCount: number;
}

type DealInput = Omit<Deal, "badge" | "color" | "ctaLabel" | "bestPrice"> &
  Partial<Pick<Deal, "badge" | "color" | "ctaLabel" | "bestPrice">>;

const DEFAULT_DEAL_VALUES: Required<Pick<Deal, "badge" | "color" | "ctaLabel">> = {
  badge: "Promo",
  color: "from-slate-900/70 to-slate-800/70",
  ctaLabel: "Profiter de l'offre →",
};

const defineDeal = (deal: DealInput): Deal => ({
  ...DEFAULT_DEAL_VALUES,
  bestPrice: false,
  ...deal,
});

export const deals: Deal[] = [
  defineDeal({
    id: "whey-isolate-2kg",
    productName: "Whey Isolate 2kg",
    currentPrice: 47.9,
    originalPrice: 72.9,
    discountPercent: 34,
    hook: "Isolat de whey premium + shaker offert chez OptiPower.",
    badge: "Top Deal",
    color: "from-orange-500/80 to-red-500/80",
    deadline: "2030-01-01T00:00:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1549561434-d2059f2ff538?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Pot de whey isolate 2kg posé sur un plan de travail sportif",
    bestPrice: true,
    rating: 4.8,
    reviewCount: 276,
  }),
  defineDeal({
    id: "creatine-monohydrate-500g",
    productName: "Créatine Monohydrate 500g",
    currentPrice: 14.9,
    originalPrice: 24.9,
    discountPercent: 40,
    hook: "Stock limité : livraison express offerte dès 2 pots.",
    badge: "Flash",
    color: "from-blue-500/80 to-cyan-500/80",
    deadline: "2025-06-01T12:00:00.000Z",
    imageUrl:
      "https://images.unsplash.com/photo-1585238341986-410252206994?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Sachet de créatine monohydrate posé à côté d'une cuillère doseuse",
    rating: 4.6,
    reviewCount: 198,
  }),
  defineDeal({
    id: "lifting-belt-premium",
    productName: "Ceinture de force premium cuir",
    currentPrice: 59.9,
    originalPrice: 79.9,
    discountPercent: 25,
    hook: "Conçue pour le powerlifting : double couture renforcée.",
    badge: "Accessoires",
    color: "from-purple-500/80 to-pink-500/80",
    imageUrl:
      "https://images.unsplash.com/photo-1600180758890-6d9be482e1d7?auto=format&fit=crop&w=600&q=80",
    imageAlt: "Ceinture de force en cuir marron avec boucle métallique",
    rating: 4.9,
    reviewCount: 412,
  }),
];
