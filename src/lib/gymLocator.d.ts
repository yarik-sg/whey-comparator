export interface GymLocation {
  id: string;
  name: string;
  brand: string;
  address: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  travelTime: string | null;
  monthlyPrice: number | null;
  price: number | null;
  currency: string;
  website: string | null;
  link: string | null;
  amenities: string[];
  images: string[];
  source: {
    provider: string;
    brand: string;
    externalId?: string;
  };
  updatedAt: string | null;
}

export interface GymQueryFilters {
  city?: string;
  maxDistanceKm?: number;
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface GymLocatorResponse {
  gyms: GymLocation[];
  availableCities: string[];
  count: number;
  total: number;
  filters: GymQueryFilters;
  servedFrom?: 'api' | 'mock' | 'fallback';
}

export declare const mockGyms: unknown[];

export declare function buildGymSearchParams(filters?: GymQueryFilters): URLSearchParams;
export declare function fetchGymsFromApi(filters?: GymQueryFilters): Promise<GymLocatorResponse>;
export declare function getFallbackGyms(filters?: GymQueryFilters): GymLocatorResponse;
export declare function fetchGyms(filters?: GymQueryFilters): Promise<GymLocatorResponse>;

declare const _default: {
  fetchGyms: typeof fetchGyms;
  fetchGymsFromApi: typeof fetchGymsFromApi;
  getFallbackGyms: typeof getFallbackGyms;
  buildGymSearchParams: typeof buildGymSearchParams;
  mockGyms: typeof mockGyms;
};

export default _default;
