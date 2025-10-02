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
}

type DealInput = Omit<Deal, "badge" | "color" | "ctaLabel"> &
  Partial<Pick<Deal, "badge" | "color" | "ctaLabel">>;

const DEFAULT_DEAL_VALUES: Required<Pick<Deal, "badge" | "color" | "ctaLabel">> = {
  badge: "Promo",
  color: "from-slate-900/70 to-slate-800/70",
  ctaLabel: "Profiter de l'offre →",
};

const defineDeal = (deal: DealInput): Deal => ({
  ...DEFAULT_DEAL_VALUES,
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
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
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
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
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
  }),
];
