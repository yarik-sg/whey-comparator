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
  totalPrice?: ApiPrice | null;
  shippingCost?: number | null;
  shippingText?: string | null;
  inStock?: boolean | null;
  stockStatus?: string | null;
  link?: string | null;
  image?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  bestPrice: boolean;
  isBestPrice?: boolean;
  source: string;
  productId?: number | null;
  expiresAt?: string | null;
  weightKg?: number | null;
  pricePerKg?: number | null;
}

export interface PriceHistoryPoint {
  recordedAt: string;
  source?: string | null;
  price: ApiPrice;
}

export interface PriceHistoryResponse {
  productId: number;
  period: string;
  points: PriceHistoryPoint[];
  statistics: {
    lowest: ApiPrice;
    highest: ApiPrice;
    average: ApiPrice;
    current: ApiPrice;
  };
}

export interface ProductSummary {
  id: number;
  name: string;
  brand?: string | null;
  flavour?: string | null;
  image?: string | null;
  image_url?: string | null;
  protein_per_serving_g?: number | null;
  serving_size_g?: number | null;
  category?: string | null;
  bestPrice: ApiPrice;
  totalPrice?: ApiPrice | null;
  bestDeal?: DealItem | null;
  offersCount: number;
  inStock?: boolean | null;
  stockStatus?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  proteinPerEuro?: number | null;
  pricePerKg?: number | null;
  bestVendor?: string | null;
}

export interface ProductListResponse {
  products: ProductSummary[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface ScraperOffer {
  id: number;
  source: string;
  url: string;
  price: number;
  currency: string;
  price_per_100g_protein?: number | null;
  stock_status?: string | null;
  in_stock?: boolean | null;
  shipping_cost?: number | null;
  shipping_text?: string | null;
  last_checked?: string | null;
}

export interface ProductOffersResponse {
  product: ProductSummary;
  offers: DealItem[];
  sources: {
    scraper: ScraperOffer[];
  };
}

export interface RelatedProductsResponse {
  productId: number;
  related: ProductSummary[];
}

export interface ComparisonEntry {
  product: ProductSummary;
  offers: DealItem[];
}

export interface ComparisonResponse {
  products: ComparisonEntry[];
  summary: DealItem[];
}
