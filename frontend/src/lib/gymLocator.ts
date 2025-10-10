import apiClient from "@/lib/apiClient";

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
  servedFrom?: "api" | "mock" | "fallback";
}

type ApiGymLocation = {
  id?: string;
  name?: string;
  brand?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number | null;
  estimated_duration?: string | null;
  monthly_price?: number | null;
  price?: number | null;
  currency?: string | null;
  website?: string | null;
  link?: string | null;
  amenities?: Array<string | null | undefined> | null;
  images?: Array<string | null | undefined> | null;
  source?: {
    provider?: string | null;
    brand?: string | null;
    external_id?: string | null;
  } | null;
  updated_at?: string | null;
};

type ApiGymResponse = {
  gyms?: ApiGymLocation[] | null;
  available_cities?: string[] | null;
  count?: number | null;
  total?: number | null;
  filters?: Record<string, unknown> | null;
  served_from?: "api" | "mock" | "fallback" | null;
};

const EARTH_RADIUS_KM = 6371;
const AVERAGE_URBAN_SPEED_KMH = 25;

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const estimateTravelTime = (distanceKm: number | null | undefined): string | null => {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return null;
  }

  const minutes = Math.max(1, Math.round((distanceKm / AVERAGE_URBAN_SPEED_KMH) * 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
};

const sanitizeAmenities = (values: Array<string | null | undefined> | null | undefined): string[] => {
  if (!values) {
    return [];
  }

  const amenities = values
    .map((value) => normalizeString(value ?? undefined))
    .filter((value) => value.length > 0);

  const unique = Array.from(new Set(amenities));
  unique.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  return unique;
};

const sanitizeImages = (values: Array<string | null | undefined> | null | undefined): string[] => {
  if (!values) {
    return [];
  }

  return values
    .map((value) => normalizeString(value ?? undefined))
    .filter((value) => value.length > 0);
};

const normalizeApiGym = (gym: ApiGymLocation): GymLocation => {
  const latitude = typeof gym.latitude === "number" && Number.isFinite(gym.latitude) ? gym.latitude : null;
  const longitude = typeof gym.longitude === "number" && Number.isFinite(gym.longitude) ? gym.longitude : null;
  const distance =
    typeof gym.distance_km === "number" && Number.isFinite(gym.distance_km)
      ? Number.parseFloat(gym.distance_km.toFixed(2))
      : null;

  const brand = normalizeString(gym.brand ?? "Enseigne");
  const name = normalizeString(gym.name ?? "Salle de sport");

  const fallbackId = slugify(`${brand || "gym"}-${name || "club"}`);

  const source = {
    provider: normalizeString(gym.source?.provider ?? ""),
    brand: normalizeString(gym.source?.brand ?? brand),
    ...(gym.source?.external_id ? { externalId: normalizeString(gym.source.external_id) } : {}),
  };

  const price =
    typeof gym.monthly_price === "number" && Number.isFinite(gym.monthly_price)
      ? gym.monthly_price
      : typeof gym.price === "number" && Number.isFinite(gym.price)
        ? gym.price
        : null;

  const website = normalizeString(gym.website ?? gym.link ?? "") || null;

  return {
    id: normalizeString(gym.id ?? "") || fallbackId,
    name,
    brand: brand || "Indisponible",
    address: normalizeString(gym.address ?? "Adresse à venir"),
    postalCode: normalizeString(gym.postal_code ?? ""),
    city: normalizeString(gym.city ?? ""),
    latitude,
    longitude,
    distanceKm: distance,
    travelTime: gym.estimated_duration ? normalizeString(gym.estimated_duration) : estimateTravelTime(distance),
    monthlyPrice: price,
    price,
    currency: normalizeString(gym.currency ?? "EUR") || "EUR",
    website,
    link: website,
    amenities: sanitizeAmenities(gym.amenities),
    images: sanitizeImages(gym.images),
    source,
    updatedAt: gym.updated_at ?? null,
  };
};

const sanitizeFilters = (filters: GymQueryFilters = {}): GymQueryFilters => {
  const normalized: GymQueryFilters = {};

  if (typeof filters.city === "string" && filters.city.trim().length > 0) {
    normalized.city = filters.city.trim();
  }

  if (typeof filters.maxDistanceKm === "number" && Number.isFinite(filters.maxDistanceKm)) {
    normalized.maxDistanceKm = Math.max(0, filters.maxDistanceKm);
  }

  if (typeof filters.lat === "number" && Number.isFinite(filters.lat)) {
    normalized.lat = filters.lat;
  }

  if (typeof filters.lng === "number" && Number.isFinite(filters.lng)) {
    normalized.lng = filters.lng;
  }

  if (typeof filters.limit === "number" && Number.isFinite(filters.limit)) {
    normalized.limit = Math.max(1, Math.floor(filters.limit));
  }

  return normalized;
};

const normalizeApiFilters = (filters: Record<string, unknown> | null | undefined): GymQueryFilters => {
  if (!filters) {
    return {};
  }

  const normalized: GymQueryFilters = {};

  if (typeof filters["city"] === "string") {
    normalized.city = filters["city"].trim();
  }

  const maxDistance = filters["max_distance_km"];
  if (typeof maxDistance === "number") {
    normalized.maxDistanceKm = Math.max(0, maxDistance);
  }

  if (typeof filters["lat"] === "number") {
    normalized.lat = filters["lat"];
  }

  if (typeof filters["lng"] === "number") {
    normalized.lng = filters["lng"];
  }

  const limit = filters["limit"];
  if (typeof limit === "number") {
    normalized.limit = Math.max(1, Math.floor(limit));
  }

  return normalized;
};

const BASE_MOCK_GYMS: GymLocation[] = [
  {
    id: "basicfit-paris-bercy",
    name: "Basic-Fit Paris Bercy",
    brand: "Basic-Fit",
    address: "24 Rue de Bercy",
    postalCode: "75012",
    city: "Paris",
    latitude: 48.84005,
    longitude: 2.3831,
    distanceKm: 1.1,
    travelTime: estimateTravelTime(1.1),
    monthlyPrice: 24.99,
    price: 24.99,
    currency: "EUR",
    website: "https://www.basic-fit.com/fr-fr/clubs/basic-fit-paris-bercy",
    link: "https://www.basic-fit.com/fr-fr/clubs/basic-fit-paris-bercy",
    amenities: ["24/7", "Cours collectifs virtuels", "Zone functional training"],
    images: [],
    source: { provider: "mock", brand: "Basic-Fit" },
    updatedAt: null,
  },
  {
    id: "fitnesspark-lyon-part-dieu",
    name: "Fitness Park Lyon Part-Dieu",
    brand: "Fitness Park",
    address: "91 Cours Lafayette",
    postalCode: "69006",
    city: "Lyon",
    latitude: 45.76266,
    longitude: 4.85538,
    distanceKm: 1.8,
    travelTime: estimateTravelTime(1.8),
    monthlyPrice: 29.95,
    price: 29.95,
    currency: "EUR",
    website: "https://www.fitnesspark.fr/clubs/lyon-part-dieu/",
    link: "https://www.fitnesspark.fr/clubs/lyon-part-dieu/",
    amenities: ["Espace musculation", "Cardio-training", "Studio biking"],
    images: [],
    source: { provider: "mock", brand: "Fitness Park" },
    updatedAt: null,
  },
  {
    id: "onair-marseille-prado",
    name: "On Air Marseille Prado",
    brand: "On Air",
    address: "6 Avenue du Prado",
    postalCode: "13006",
    city: "Marseille",
    latitude: 43.28535,
    longitude: 5.37897,
    distanceKm: 2.4,
    travelTime: estimateTravelTime(2.4),
    monthlyPrice: 34.9,
    price: 34.9,
    currency: "EUR",
    website: "https://www.onair-fitness.fr/clubs/marseille-prado",
    link: "https://www.onair-fitness.fr/clubs/marseille-prado",
    amenities: ["Cours collectifs live", "Espace cross training", "Sauna"],
    images: [],
    source: { provider: "mock", brand: "On Air" },
    updatedAt: null,
  },
  {
    id: "neoness-paris-chatelet",
    name: "Neoness Paris Châtelet",
    brand: "Neoness",
    address: "5 Rue de la Ferronnerie",
    postalCode: "75001",
    city: "Paris",
    latitude: 48.86078,
    longitude: 2.34699,
    distanceKm: 0.8,
    travelTime: estimateTravelTime(0.8),
    monthlyPrice: 19.9,
    price: 19.9,
    currency: "EUR",
    website: "https://www.neoness.fr/salle-de-sport/paris-chatelet",
    link: "https://www.neoness.fr/salle-de-sport/paris-chatelet",
    amenities: ["Cardio", "Cross-training", "Studio danse"],
    images: [],
    source: { provider: "mock", brand: "Neoness" },
    updatedAt: null,
  },
  {
    id: "keepcool-toulouse-capitole",
    name: "Keepcool Toulouse Capitole",
    brand: "Keepcool",
    address: "11 Rue du Poids de l’Huile",
    postalCode: "31000",
    city: "Toulouse",
    latitude: 43.60398,
    longitude: 1.44329,
    distanceKm: 0.6,
    travelTime: estimateTravelTime(0.6),
    monthlyPrice: 29.9,
    price: 29.9,
    currency: "EUR",
    website: "https://www.keepcool.fr/salle-de-sport/toulouse-capitole",
    link: "https://www.keepcool.fr/salle-de-sport/toulouse-capitole",
    amenities: ["Small group training", "Espace femme", "Coaching inclus"],
    images: [],
    source: { provider: "mock", brand: "Keepcool" },
    updatedAt: null,
  },
  {
    id: "basicfit-lille-euralille",
    name: "Basic-Fit Lille Euralille",
    brand: "Basic-Fit",
    address: "150 Centre Commercial Euralille",
    postalCode: "59777",
    city: "Lille",
    latitude: 50.63709,
    longitude: 3.06971,
    distanceKm: 1.5,
    travelTime: estimateTravelTime(1.5),
    monthlyPrice: 22.99,
    price: 22.99,
    currency: "EUR",
    website: "https://www.basic-fit.com/fr-fr/clubs/basic-fit-lille-euralille",
    link: "https://www.basic-fit.com/fr-fr/clubs/basic-fit-lille-euralille",
    amenities: ["Zone cycle", "Cours virtuels", "Espace musculation"],
    images: [],
    source: { provider: "mock", brand: "Basic-Fit" },
    updatedAt: null,
  },
  {
    id: "fitnesspark-bordeaux-lac",
    name: "Fitness Park Bordeaux Lac",
    brand: "Fitness Park",
    address: "Rue du Professeur Georges Jeanneney",
    postalCode: "33300",
    city: "Bordeaux",
    latitude: 44.88798,
    longitude: -0.56416,
    distanceKm: 3.4,
    travelTime: estimateTravelTime(3.4),
    monthlyPrice: 29.95,
    price: 29.95,
    currency: "EUR",
    website: "https://www.fitnesspark.fr/clubs/bordeaux-lac/",
    link: "https://www.fitnesspark.fr/clubs/bordeaux-lac/",
    amenities: ["Parking gratuit", "Studio biking", "Zone cross training"],
    images: [],
    source: { provider: "mock", brand: "Fitness Park" },
    updatedAt: null,
  },
  {
    id: "onair-nice-lingostiere",
    name: "On Air Nice Lingostière",
    brand: "On Air",
    address: "652 Route de Grenoble",
    postalCode: "06200",
    city: "Nice",
    latitude: 43.70853,
    longitude: 7.19748,
    distanceKm: 4.1,
    travelTime: estimateTravelTime(4.1),
    monthlyPrice: 39.9,
    price: 39.9,
    currency: "EUR",
    website: "https://www.onair-fitness.fr/clubs/nice-lingostiere",
    link: "https://www.onair-fitness.fr/clubs/nice-lingostiere",
    amenities: ["Espace premium", "Cours immersive", "Studio cycling"],
    images: [],
    source: { provider: "mock", brand: "On Air" },
    updatedAt: null,
  },
];

const collectAvailableCities = (gyms: readonly GymLocation[]): string[] => {
  const cities = Array.from(
    new Set(
      gyms
        .map((gym) => normalizeString(gym.city))
        .filter((city) => city.length > 0),
    ),
  );

  cities.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  return cities;
};

export const mockGyms: GymLocation[] = BASE_MOCK_GYMS;

export const buildGymSearchParams = (filters: GymQueryFilters = {}): URLSearchParams => {
  const params = new URLSearchParams();
  const normalized = sanitizeFilters(filters);

  if (normalized.city) {
    params.set("city", normalized.city);
  }

  if (typeof normalized.maxDistanceKm === "number") {
    params.set("max_distance_km", normalized.maxDistanceKm.toString());
  }

  if (typeof normalized.lat === "number") {
    params.set("lat", normalized.lat.toString());
  }

  if (typeof normalized.lng === "number") {
    params.set("lng", normalized.lng.toString());
  }

  if (typeof normalized.limit === "number") {
    params.set("limit", normalized.limit.toString());
  }

  return params;
};

const applyFallbackFilters = (filters: GymQueryFilters): GymLocation[] => {
  const normalized = sanitizeFilters(filters);
  const coordinates =
    typeof normalized.lat === "number" && typeof normalized.lng === "number"
      ? { lat: normalized.lat, lng: normalized.lng }
      : null;

  const withComputedDistance = BASE_MOCK_GYMS.map((gym) => {
    if (!coordinates || typeof gym.latitude !== "number" || typeof gym.longitude !== "number") {
      return {
        ...gym,
        travelTime: estimateTravelTime(gym.distanceKm),
      };
    }

    const computedDistance = haversineDistanceKm(
      coordinates.lat,
      coordinates.lng,
      gym.latitude,
      gym.longitude,
    );

    const roundedDistance = Number.parseFloat(computedDistance.toFixed(2));

    return {
      ...gym,
      distanceKm: roundedDistance,
      travelTime: estimateTravelTime(roundedDistance),
    };
  });

  const filteredByCity = normalized.city
    ? withComputedDistance.filter((gym) => gym.city.toLowerCase() === normalized.city!.toLowerCase())
    : withComputedDistance;

  const filteredByDistance =
    typeof normalized.maxDistanceKm === "number"
      ? filteredByCity.filter((gym) => {
          if (typeof gym.distanceKm !== "number") {
            return true;
          }
          return gym.distanceKm <= normalized.maxDistanceKm!;
        })
      : filteredByCity;

  const sorted = filteredByDistance.slice().sort((a, b) => {
    const distanceA = typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
    const distanceB = typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  if (typeof normalized.limit === "number") {
    return sorted.slice(0, normalized.limit);
  }

  return sorted;
};

export const fetchGymsFromApi = async (
  filters: GymQueryFilters = {},
): Promise<GymLocatorResponse> => {
  const params = buildGymSearchParams(filters);
  const data = await apiClient.get<ApiGymResponse>("/api/gyms", {
    query: params,
    cache: "no-store",
    allowProxyFallback: false,
  });

  const gyms = Array.isArray(data.gyms) ? data.gyms.map(normalizeApiGym) : [];

  return {
    gyms,
    availableCities: Array.isArray(data.available_cities)
      ? data.available_cities.filter((city): city is string => typeof city === "string")
      : collectAvailableCities(gyms),
    count: typeof data.count === "number" ? data.count : gyms.length,
    total: typeof data.total === "number" ? data.total : gyms.length,
    filters: normalizeApiFilters(data.filters),
    servedFrom: data.served_from ?? "api",
  };
};

export const getFallbackGyms = (filters: GymQueryFilters = {}): GymLocatorResponse => {
  const normalized = sanitizeFilters(filters);
  const results = applyFallbackFilters(normalized);
  const totalMatches = applyFallbackFilters({ ...normalized, limit: undefined }).length;

  return {
    gyms: results,
    availableCities: collectAvailableCities(BASE_MOCK_GYMS),
    count: results.length,
    total: totalMatches,
    filters: normalized,
    servedFrom: "mock",
  };
};

export const fetchGyms = async (
  filters: GymQueryFilters = {},
): Promise<GymLocatorResponse> => {
  try {
    const response = await fetchGymsFromApi(filters);

    if (!response.gyms.length) {
      const fallback = getFallbackGyms(filters);
      return { ...fallback, servedFrom: "fallback" };
    }

    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("fetchGymsFromApi failed, falling back to mock dataset", error);
    }

    return getFallbackGyms(filters);
  }
};

export default {
  fetchGyms,
  fetchGymsFromApi,
  getFallbackGyms,
  buildGymSearchParams,
  mockGyms,
};
