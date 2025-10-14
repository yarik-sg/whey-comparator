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
  productId?: string | number | null;
  expiresAt?: string | null;
  weightKg?: number | null;
  pricePerKg?: number | null;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
  currency: string;
  platform?: string | null;
  in_stock?: boolean | null;
}

export interface PriceHistoryStatistics {
  current_price: number;
  lowest_price: number;
  highest_price: number;
  average_price: number;
  price_change_percent: number;
  trend: string;
  data_points: number;
  is_historical_low: boolean;
}

export interface PriceHistoryResponse {
  product_id: number;
  period: string;
  history: PriceHistoryPoint[];
  statistics: PriceHistoryStatistics | null;
}

export interface ProductSummary {
  id: number | string;
  product_id?: string | null;
  name: string;
  brand?: string | null;
  flavour?: string | null;
  image?: string | null;
  image_url?: string | null;
  gallery?: string[] | null;
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
  isBestPrice?: boolean | null;
  discount?: number | null;
  originalPrice?: ApiPrice | null;
}

export interface ProgramSummary {
  id: string;
  name: string;
  focus?: string | null;
  level?: string | null;
  description?: string | null;
  durationWeeks?: number | null;
  sessionsPerWeek?: number | null;
  intensity?: string | null;
  equipmentNeeded?: string[] | null;
  coach?: string | null;
  price?: ApiPrice | null;
  link?: string | null;
}

export interface EquipmentSummary {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  highlights?: string[] | null;
  price?: ApiPrice | null;
  bestVendor?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  image?: string | null;
  link?: string | null;
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

export interface SimilarProductsResponse {
  productId: number;
  similar: ProductSummary[];
}

export interface ComparisonEntry {
  product: ProductSummary;
  offers: DealItem[];
}

export interface ComparisonResponse {
  products: ComparisonEntry[];
  summary: DealItem[];
}

export interface ReviewBreakdownEntry {
  stars: number;
  count: number;
  percentage: number;
}

export interface ReviewHighlight {
  id: string;
  title: string;
  rating: number;
  summary: string;
  source: string;
  url?: string | null;
}

export interface ProductReviewsResponse {
  productId: number;
  averageRating?: number | null;
  reviewsCount: number;
  sources: number;
  distribution: ReviewBreakdownEntry[];
  highlights: ReviewHighlight[];
}

export interface PriceAlertRecord {
  id: number;
  user_email: string;
  product_id: number;
  target_price: number | string;
  platform?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  product?: ProductSummary | null;
}
