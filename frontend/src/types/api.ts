export interface ApiPrice {
  amount: number | null;
  currency: string | null;
  formatted: string | null;
}

export interface DealItem {
  id: string;
  title: string;
  vendor: string;
  price: ApiPrice;
  link?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  bestPrice: boolean;
  source: string;
  productId?: number | null;
  expiresAt?: string | null;
  weightKg?: number | null;
  pricePerKg?: number | null;
}

export interface ProductSummary {
  id: number;
  name: string;
  brand?: string | null;
  flavour?: string | null;
  protein_per_serving_g?: number | null;
  serving_size_g?: number | null;
}

export interface ScraperOffer {
  id: number;
  source: string;
  url: string;
  price: number;
  currency: string;
  price_per_100g_protein?: number | null;
  stock_status?: string | null;
  last_checked?: string | null;
}

export interface ProductOffersResponse {
  product: ProductSummary;
  offers: DealItem[];
  sources: {
    scraper: ScraperOffer[];
  };
}

export interface ComparisonEntry {
  product: ProductSummary;
  offers: DealItem[];
}

export interface ComparisonResponse {
  products: ComparisonEntry[];
  summary: DealItem[];
}
