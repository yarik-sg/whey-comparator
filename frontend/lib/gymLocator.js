import crypto from "node:crypto";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const REQUEST_TIMEOUT = 12_000;
const EARTH_RADIUS_KM = 6371;
const AVERAGE_URBAN_SPEED_KMH = 25;

const BASIC_FIT_BASE_URL = "https://www.basic-fit.com";
const BASIC_FIT_ENDPOINT =
  "https://www.basic-fit.com/on/demandware.store/Sites-BasicFit-Site/fr_FR/Stores-Find";

const FITNESS_PARK_ENDPOINTS = [
  "https://www.fitnesspark.fr/wp-json/wp/v2/club?per_page=200",
  "https://www.fitnesspark.fr/wp-json/wp/v2/clubs?per_page=200",
  "https://www.fitnesspark.fr/wp-json/fitness/v1/clubs",
];

const NEONESS_ENDPOINTS = [
  "https://www.neoness.fr/wp-json/wp/v2/club?per_page=200",
  "https://www.neoness.fr/wp-json/wp/v2/clubs?per_page=200",
  "https://www.neoness.fr/wp-json/neoness/v1/clubs",
];

const ON_AIR_ENDPOINTS = [
  "https://onair-fitness.fr/wp-json/wp/v2/club?per_page=200",
  "https://onair-fitness.fr/wp-json/wp/v2/clubs?per_page=200",
  "https://onair-fitness.fr/wp-json/onair/v1/clubs",
];

const hasAbortController = typeof globalThis.AbortController !== "undefined";
const fetchFn = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : undefined;
const scheduleTimeout = typeof globalThis.setTimeout === "function" ? globalThis.setTimeout.bind(globalThis) : undefined;
const clearScheduledTimeout =
  typeof globalThis.clearTimeout === "function" ? globalThis.clearTimeout.bind(globalThis) : undefined;
const SearchParams = typeof globalThis.URLSearchParams === "function" ? globalThis.URLSearchParams : undefined;

const normalizeString = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return "";
};

const parseNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d+\-.,]/g, "");
    const withDot = normalized.replace(/,/g, ".");
    const parsed = Number.parseFloat(withDot);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parsePrice = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const match = value.match(/(\d+[\d.,]*)/u);
    if (match) {
      const normalized = match[1].replace(/\./g, "").replace(/,/g, ".");
      const parsed = Number.parseFloat(normalized);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const slugify = (value) =>
  normalizeString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/(^-|-$)+/g, "");

const absoluteUrl = (base, url) => {
  const candidate = normalizeString(url);
  if (!candidate) {
    return null;
  }
  if (/^https?:/i.test(candidate)) {
    return candidate;
  }
  return `${base}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
};

const hashId = (value) =>
  crypto.createHash("md5").update(value ?? "", "utf8").digest("hex").slice(0, 16);

const fetchWithTimeout = async (url, options = {}) => {
  if (!fetchFn) {
    throw new Error("Global fetch is not available in this runtime");
  }

  const controller = hasAbortController ? new globalThis.AbortController() : undefined;
  const timeout = options.timeout ?? REQUEST_TIMEOUT;
  const timeoutId = scheduleTimeout ? scheduleTimeout(() => controller?.abort(), timeout) : undefined;

  try {
    const response = await fetchFn(url, {
      ...options,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        ...(options.headers ?? {}),
      },
      signal: controller?.signal,
    });
    return response;
  } finally {
    if (timeoutId && clearScheduledTimeout) {
      clearScheduledTimeout(timeoutId);
    }
  }
};

const tryParseJson = (text) => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const nuxtMatch = text.match(/window\.__NUXT__\s*=\s*(\{.*?\})\s*;<\/script>/s);
    if (nuxtMatch) {
      try {
        return JSON.parse(nuxtMatch[1]);
      } catch (innerError) {
        return null;
      }
    }

    const nextMatch = text.match(/<script id="__NEXT_DATA__" type="application\/json">(\{.*?\})<\/script>/s);
    if (nextMatch) {
      try {
        return JSON.parse(nextMatch[1]);
      } catch (innerError) {
        return null;
      }
    }
  }
  return null;
};

const fetchJson = async (url) => {
  const response = await fetchWithTimeout(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status})`);
  }
  const text = await response.text();
  const parsed = tryParseJson(text);
  if (!parsed) {
    throw new Error(`Unable to parse JSON payload for ${url}`);
  }
  return parsed;
};

const unique = (values) => {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value) continue;
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
};

const flatten = (values) => values.reduce((acc, value) => acc.concat(value ?? []), []);

const getNestedValue = (object, path) => {
  if (!object || typeof object !== "object") {
    return undefined;
  }
  const parts = path.split(".");
  let current = object;
  for (const part of parts) {
    if (current == null) {
      return undefined;
    }
    const arrayMatch = part.match(/^(.*)\[(\d+)]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      const arrayValue = current[key];
      if (!Array.isArray(arrayValue)) {
        return undefined;
      }
      current = arrayValue[Number.parseInt(index, 10)];
      continue;
    }
    current = current[part];
  }
  return current;
};

const resolveField = (object, candidates) => {
  for (const candidate of candidates) {
    const value = getNestedValue(object, candidate);
    if (value != null) {
      return value;
    }
  }
  return undefined;
};

const createGymRecord = ({
  id,
  name,
  brand,
  address,
  postalCode,
  city,
  latitude,
  longitude,
  price,
  link,
  currency = "EUR",
  provider,
  externalId,
  amenities = [],
  distanceKm = null,
  estimatedDuration = null,
  updatedAt = null,
}) => {
  const normalizedName = normalizeString(name) || "Salle de sport";
  const normalizedBrand = normalizeString(brand) || "Gym";
  const normalizedAddress = normalizeString(address) || normalizeString(city);
  const normalizedCity = normalizeString(city);
  const normalizedPostalCode = normalizeString(postalCode);
  const normalizedLink = normalizeString(link) || null;
  const normalizedId = normalizeString(id) || slugify(`${normalizedBrand}-${normalizedName}-${normalizedCity}`);
  const numericPrice = price != null ? parsePrice(price) : null;
  const numericLatitude = parseNumber(latitude);
  const numericLongitude = parseNumber(longitude);
  const numericDistance = distanceKm != null ? parseNumber(distanceKm) : null;

  return {
    id: normalizedId || hashId(`${normalizedBrand}-${normalizedName}-${normalizedCity}`),
    name: normalizedName,
    brand: normalizedBrand,
    address: normalizedAddress,
    postal_code: normalizedPostalCode,
    city: normalizedCity,
    latitude: Number.isFinite(numericLatitude) ? numericLatitude : null,
    longitude: Number.isFinite(numericLongitude) ? numericLongitude : null,
    distance_km: Number.isFinite(numericDistance) ? Number.parseFloat(numericDistance.toFixed(2)) : null,
    estimated_duration: estimatedDuration ?? null,
    monthly_price: numericPrice,
    price: numericPrice,
    currency: currency || "EUR",
    website: normalizedLink,
    link: normalizedLink,
    amenities: Array.isArray(amenities) ? amenities.map((value) => normalizeString(value)).filter(Boolean) : [],
    images: [],
    source: {
      provider: normalizeString(provider) || "api",
      brand: normalizedBrand,
      ...(externalId ? { external_id: normalizeString(externalId) } : {}),
    },
    updated_at: updatedAt ?? null,
  };
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const estimateTravelTime = (distanceKm) => {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return null;
  }
  const minutes = Math.max(1, Math.round((distanceKm / AVERAGE_URBAN_SPEED_KMH) * 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${remaining} min`;
};

const enrichWithGeo = (gyms, filters) => {
  const hasCoordinates = typeof filters.lat === "number" && typeof filters.lng === "number";
  return gyms.map((gym) => {
    if (!hasCoordinates) {
      if (
        typeof gym.distance_km === "number" &&
        gym.distance_km != null &&
        gym.estimated_duration == null
      ) {
        return {
          ...gym,
          estimated_duration: estimateTravelTime(gym.distance_km),
        };
      }
      return gym;
    }

    if (typeof gym.latitude !== "number" || typeof gym.longitude !== "number") {
      return gym;
    }

    const distanceKm = haversineDistanceKm(filters.lat, filters.lng, gym.latitude, gym.longitude);
    return {
      ...gym,
      distance_km: Number.parseFloat(distanceKm.toFixed(2)),
      estimated_duration: estimateTravelTime(distanceKm),
    };
  });
};

const filterGyms = (gyms, filters) => {
  let result = gyms;

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    result = result.filter((gym) => gym.city?.toLowerCase().includes(cityLower));
  }

  if (typeof filters.maxDistanceKm === "number" && Number.isFinite(filters.maxDistanceKm)) {
    result = result.filter((gym) => {
      if (typeof gym.distance_km !== "number") {
        return true;
      }
      return gym.distance_km <= filters.maxDistanceKm;
    });
  }

  result = result.sort((a, b) => {
    const distanceA = typeof a.distance_km === "number" ? a.distance_km : Number.POSITIVE_INFINITY;
    const distanceB = typeof b.distance_km === "number" ? b.distance_km : Number.POSITIVE_INFINITY;
    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  if (typeof filters.limit === "number" && filters.limit > 0) {
    return result.slice(0, filters.limit);
  }

  return result;
};

const collectCities = (gyms) => {
  const cities = gyms
    .map((gym) => normalizeString(gym.city))
    .filter((city) => city.length > 0);
  return unique(cities).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
};

const sanitizeFilters = (filters = {}) => {
  const normalized = {};

  const city = filters.city ?? filters.ville;
  if (typeof city === "string" && city.trim().length > 0) {
    normalized.city = city.trim();
  }

  const lat = filters.lat ?? filters.latitude;
  const parsedLat = parseNumber(lat);
  if (parsedLat != null) {
    normalized.lat = parsedLat;
  }

  const lng = filters.lng ?? filters.lon ?? filters.longitude;
  const parsedLng = parseNumber(lng);
  if (parsedLng != null) {
    normalized.lng = parsedLng;
  }

  const maxDistance = filters.maxDistanceKm ?? filters.max_distance_km ?? filters.radius;
  const parsedMaxDistance = parseNumber(maxDistance);
  if (parsedMaxDistance != null) {
    normalized.maxDistanceKm = Math.max(0, parsedMaxDistance);
  }

  const limit = filters.limit ?? filters.take;
  const parsedLimit = parseNumber(limit);
  if (parsedLimit != null) {
    normalized.limit = Math.max(1, Math.floor(parsedLimit));
  }

  return normalized;
};

const deduplicateGyms = (gyms) => {
  const map = new Map();
  for (const gym of gyms) {
    const key = gym.id || hashId(`${gym.brand}-${gym.name}-${gym.city}`);
    if (!map.has(key)) {
      map.set(key, { ...gym, id: key });
    }
  }
  return Array.from(map.values());
};

const buildFallbackGym = (data) =>
  createGymRecord({
    ...data,
    provider: data.provider ?? slugify(data.brand ?? "fallback"),
    externalId: data.externalId ?? data.id,
  });

const BASIC_FIT_FALLBACK = deduplicateGyms([
  buildFallbackGym({
    id: "basic-fit-paris-oberkampf",
    name: "Basic-Fit Paris Oberkampf",
    brand: "Basic-Fit",
    address: "114 Rue Oberkampf",
    postalCode: "75011",
    city: "Paris",
    latitude: 48.86514,
    longitude: 2.38057,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-paris-oberkampf`,
    amenities: ["Ouvert 24/7", "Cours collectifs", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "basic-fit-lyon-part-dieu",
    name: "Basic-Fit Lyon Part-Dieu",
    brand: "Basic-Fit",
    address: "150 Rue Servient",
    postalCode: "69003",
    city: "Lyon",
    latitude: 45.76202,
    longitude: 4.85179,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-lyon-part-dieu`,
    amenities: ["Zone cycling", "Espace musculation", "Cours virtuels"],
  }),
  buildFallbackGym({
    id: "basic-fit-marseille-castellane",
    name: "Basic-Fit Marseille Castellane",
    brand: "Basic-Fit",
    address: "2 Place Castellane",
    postalCode: "13006",
    city: "Marseille",
    latitude: 43.28754,
    longitude: 5.38146,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-marseille-castellane`,
    amenities: ["Cours collectifs", "Zone cardio", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "basic-fit-toulouse-jean-jaures",
    name: "Basic-Fit Toulouse Jean-Jaurès",
    brand: "Basic-Fit",
    address: "19 Allée Jean Jaurès",
    postalCode: "31000",
    city: "Toulouse",
    latitude: 43.60637,
    longitude: 1.45261,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-toulouse-jean-jaures`,
    amenities: ["Cours collectifs", "Studio cycling", "Zone stretching"],
  }),
  buildFallbackGym({
    id: "basic-fit-bordeaux-victoire",
    name: "Basic-Fit Bordeaux Victoire",
    brand: "Basic-Fit",
    address: "81 Cours de la Marne",
    postalCode: "33800",
    city: "Bordeaux",
    latitude: 44.83247,
    longitude: -0.56993,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-bordeaux-victoire`,
    amenities: ["Zone cardio", "Espace poids libres", "Cours virtuels"],
  }),
  buildFallbackGym({
    id: "basic-fit-lille-gambetta",
    name: "Basic-Fit Lille Gambetta",
    brand: "Basic-Fit",
    address: "92 Rue Léon Gambetta",
    postalCode: "59800",
    city: "Lille",
    latitude: 50.62931,
    longitude: 3.05681,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-lille-gambetta`,
    amenities: ["Espace musculation", "Cours collectifs", "Zone cardio"],
  }),
  buildFallbackGym({
    id: "basic-fit-nantes-commerce",
    name: "Basic-Fit Nantes Commerce",
    brand: "Basic-Fit",
    address: "4 Rue de l'Arche Sèche",
    postalCode: "44000",
    city: "Nantes",
    latitude: 47.21405,
    longitude: -1.55665,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-nantes-commerce`,
    amenities: ["Espace cardio", "Cours collectifs", "Zone musculation"],
  }),
  buildFallbackGym({
    id: "basic-fit-strasbourg-halles",
    name: "Basic-Fit Strasbourg Les Halles",
    brand: "Basic-Fit",
    address: "24 Place des Halles",
    postalCode: "67000",
    city: "Strasbourg",
    latitude: 48.58563,
    longitude: 7.74261,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-strasbourg-les-halles`,
    amenities: ["Cours collectifs", "Espace musculation", "Zone cardio"],
  }),
  buildFallbackGym({
    id: "basic-fit-nice-jean-medecin",
    name: "Basic-Fit Nice Jean-Médecin",
    brand: "Basic-Fit",
    address: "17 Avenue Jean Médecin",
    postalCode: "06000",
    city: "Nice",
    latitude: 43.70062,
    longitude: 7.26832,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-nice-jean-medecin`,
    amenities: ["Zone cardio", "Cours collectifs", "Espace poids libres"],
  }),
  buildFallbackGym({
    id: "basic-fit-montpellier-antigone",
    name: "Basic-Fit Montpellier Antigone",
    brand: "Basic-Fit",
    address: "205 Avenue Jacques Cartier",
    postalCode: "34000",
    city: "Montpellier",
    latitude: 43.60893,
    longitude: 3.89464,
    price: 24.99,
    link: `${BASIC_FIT_BASE_URL}/fr-fr/clubs/basic-fit-montpellier-antigone`,
    amenities: ["Espace musculation", "Zone cardio", "Cours virtuels"],
  }),
]);

const FITNESS_PARK_FALLBACK = deduplicateGyms([
  buildFallbackGym({
    id: "fitness-park-paris-15",
    name: "Fitness Park Paris 15", 
    brand: "Fitness Park",
    address: "24 Rue Mademoiselle",
    postalCode: "75015",
    city: "Paris",
    latitude: 48.84149,
    longitude: 2.30293,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/paris-15-mademoiselle/",
    amenities: ["Cardio-training", "Studio biking", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "fitness-park-bordeaux-lac",
    name: "Fitness Park Bordeaux Lac",
    brand: "Fitness Park",
    address: "Rue du Professeur Georges Jeanneney",
    postalCode: "33300",
    city: "Bordeaux",
    latitude: 44.88798,
    longitude: -0.56416,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/bordeaux-lac/",
    amenities: ["Parking gratuit", "Zone cross-training", "Cours collectifs"],
  }),
  buildFallbackGym({
    id: "fitness-park-paris-nation",
    name: "Fitness Park Paris Nation",
    brand: "Fitness Park",
    address: "21 Rue du Faubourg Saint-Antoine",
    postalCode: "75011",
    city: "Paris",
    latitude: 48.85032,
    longitude: 2.37318,
    price: 32.95,
    link: "https://www.fitnesspark.fr/clubs/paris-nation/",
    amenities: ["Espace musculation", "Cardio-training", "Studio biking"],
  }),
  buildFallbackGym({
    id: "fitness-park-lyon-republique",
    name: "Fitness Park Lyon République",
    brand: "Fitness Park",
    address: "14 Rue du Président Édouard Herriot",
    postalCode: "69001",
    city: "Lyon",
    latitude: 45.76454,
    longitude: 4.83572,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/lyon-republique/",
    amenities: ["Espace musculation", "Studio cross training", "Zone cardio"],
  }),
  buildFallbackGym({
    id: "fitness-park-marseille-joliette",
    name: "Fitness Park Marseille La Joliette",
    brand: "Fitness Park",
    address: "54 Rue de la République",
    postalCode: "13002",
    city: "Marseille",
    latitude: 43.303,
    longitude: 5.37,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/marseille-la-joliette/",
    amenities: ["Espace musculation", "Zone cross-training", "Cours collectifs"],
  }),
  buildFallbackGym({
    id: "fitness-park-toulouse-balma",
    name: "Fitness Park Toulouse Balma-Gramont",
    brand: "Fitness Park",
    address: "2 Rue Louis Bonin",
    postalCode: "31200",
    city: "Toulouse",
    latitude: 43.64312,
    longitude: 1.48052,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/toulouse-balma/",
    amenities: ["Parking gratuit", "Zone cross-training", "Cours collectifs"],
  }),
  buildFallbackGym({
    id: "fitness-park-nantes-beaulieu",
    name: "Fitness Park Nantes Beaulieu",
    brand: "Fitness Park",
    address: "Boulevard Général de Gaulle",
    postalCode: "44200",
    city: "Nantes",
    latitude: 47.20448,
    longitude: -1.53498,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/nantes-beaulieu/",
    amenities: ["Parking gratuit", "Zone cardio", "Cours collectifs"],
  }),
  buildFallbackGym({
    id: "fitness-park-lille-flandres",
    name: "Fitness Park Lille Flandres",
    brand: "Fitness Park",
    address: "35 Rue Faidherbe",
    postalCode: "59800",
    city: "Lille",
    latitude: 50.63614,
    longitude: 3.06991,
    price: 31.95,
    link: "https://www.fitnesspark.fr/clubs/lille-flandres/",
    amenities: ["Espace musculation", "Studio biking", "Zone cross-training"],
  }),
  buildFallbackGym({
    id: "fitness-park-bordeaux-merignac",
    name: "Fitness Park Bordeaux Mérignac",
    brand: "Fitness Park",
    address: "19 Avenue Gustave Eiffel",
    postalCode: "33700",
    city: "Mérignac",
    latitude: 44.83409,
    longitude: -0.69505,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/merignac/",
    amenities: ["Parking gratuit", "Zone cardio", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "fitness-park-nice-saint-isidore",
    name: "Fitness Park Nice Saint-Isidore",
    brand: "Fitness Park",
    address: "4 Rue Jules Bianchi",
    postalCode: "06200",
    city: "Nice",
    latitude: 43.7148,
    longitude: 7.1981,
    price: 31.95,
    link: "https://www.fitnesspark.fr/clubs/nice-saint-isidore/",
    amenities: ["Zone cross-training", "Studio biking", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "fitness-park-strasbourg-meinau",
    name: "Fitness Park Strasbourg Meinau",
    brand: "Fitness Park",
    address: "5 Rue du Maréchal Juin",
    postalCode: "67000",
    city: "Strasbourg",
    latitude: 48.56702,
    longitude: 7.75761,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/strasbourg-meinau/",
    amenities: ["Parking gratuit", "Zone cardio", "Cours collectifs"],
  }),
  buildFallbackGym({
    id: "fitness-park-montpellier-odysseum",
    name: "Fitness Park Montpellier Odysseum",
    brand: "Fitness Park",
    address: "2 Place de Lisbonne",
    postalCode: "34000",
    city: "Montpellier",
    latitude: 43.60702,
    longitude: 3.91882,
    price: 29.95,
    link: "https://www.fitnesspark.fr/clubs/montpellier-odysseum/",
    amenities: ["Zone cross-training", "Espace musculation", "Studio biking"],
  }),
]);

const NEONESS_FALLBACK = deduplicateGyms([
  buildFallbackGym({
    id: "neoness-paris-chatelet",
    name: "Neoness Paris Châtelet",
    brand: "Neoness",
    address: "5 Rue de la Ferronnerie",
    postalCode: "75001",
    city: "Paris",
    latitude: 48.86078,
    longitude: 2.34699,
    price: 19.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-chatelet",
    amenities: ["Cardio", "Cours collectifs", "Espace cross-training"],
  }),
  buildFallbackGym({
    id: "neoness-lyon-part-dieu",
    name: "Neoness Lyon Part-Dieu",
    brand: "Neoness",
    address: "99 Rue Moncey",
    postalCode: "69003",
    city: "Lyon",
    latitude: 45.76191,
    longitude: 4.85087,
    price: 21.9,
    link: "https://www.neoness.fr/salle-de-sport/lyon-part-dieu",
    amenities: ["Espace musculation", "Cours vidéo", "Zone stretching"],
  }),
  buildFallbackGym({
    id: "neoness-paris-montparnasse",
    name: "Neoness Paris Montparnasse",
    brand: "Neoness",
    address: "73 Rue du Départ",
    postalCode: "75014",
    city: "Paris",
    latitude: 48.84242,
    longitude: 2.32427,
    price: 19.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-montparnasse",
    amenities: ["Cardio", "Espace musculation", "Cours vidéo"],
  }),
  buildFallbackGym({
    id: "neoness-paris-batignolles",
    name: "Neoness Paris Batignolles",
    brand: "Neoness",
    address: "93 Boulevard des Batignolles",
    postalCode: "75008",
    city: "Paris",
    latitude: 48.88339,
    longitude: 2.31986,
    price: 21.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-batignolles",
    amenities: ["Espace cardio", "Cours collectifs", "Zone stretching"],
  }),
  buildFallbackGym({
    id: "neoness-paris-la-defense",
    name: "Neoness Paris La Défense",
    brand: "Neoness",
    address: "1 Esplanade du Général de Gaulle",
    postalCode: "92800",
    city: "Puteaux",
    latitude: 48.891,
    longitude: 2.23862,
    price: 24.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-la-defense",
    amenities: ["Espace musculation", "Cours vidéo", "Zone cardio"],
  }),
  buildFallbackGym({
    id: "neoness-paris-belleville",
    name: "Neoness Paris Belleville",
    brand: "Neoness",
    address: "33 Boulevard de Belleville",
    postalCode: "75011",
    city: "Paris",
    latitude: 48.87032,
    longitude: 2.38042,
    price: 19.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-belleville",
    amenities: ["Cardio", "Cours collectifs", "Espace musculation"],
  }),
  buildFallbackGym({
    id: "neoness-paris-madeleine",
    name: "Neoness Paris Madeleine",
    brand: "Neoness",
    address: "36 Boulevard de la Madeleine",
    postalCode: "75009",
    city: "Paris",
    latitude: 48.87179,
    longitude: 2.32653,
    price: 24.9,
    link: "https://www.neoness.fr/salle-de-sport/paris-madeleine",
    amenities: ["Espace cardio", "Cours vidéo", "Zone stretching"],
  }),
]);

const ON_AIR_FALLBACK = deduplicateGyms([
  buildFallbackGym({
    id: "on-air-marseille-prado",
    name: "On Air Marseille Prado",
    brand: "On Air",
    address: "6 Avenue du Prado",
    postalCode: "13006",
    city: "Marseille",
    latitude: 43.28535,
    longitude: 5.37897,
    price: 34.9,
    link: "https://www.onair-fitness.fr/clubs/marseille-prado",
    amenities: ["Cours collectifs live", "Espace cross training", "Sauna"],
  }),
  buildFallbackGym({
    id: "on-air-nice-lingostiere",
    name: "On Air Nice Lingostière",
    brand: "On Air",
    address: "652 Route de Grenoble",
    postalCode: "06200",
    city: "Nice",
    latitude: 43.70853,
    longitude: 7.19748,
    price: 39.9,
    link: "https://www.onair-fitness.fr/clubs/nice-lingostiere",
    amenities: ["Espace premium", "Studio cycling", "Cours immersifs"],
  }),
  buildFallbackGym({
    id: "on-air-paris-bercy",
    name: "On Air Paris Bercy",
    brand: "On Air",
    address: "16 Boulevard de Bercy",
    postalCode: "75012",
    city: "Paris",
    latitude: 48.84072,
    longitude: 2.37971,
    price: 39.9,
    link: "https://www.onair-fitness.fr/clubs/paris-bercy",
    amenities: ["Cours immersifs", "Studio cycling", "Espace cross training"],
  }),
  buildFallbackGym({
    id: "on-air-toulouse-labege",
    name: "On Air Toulouse Labège",
    brand: "On Air",
    address: "700 La Pyrénéenne",
    postalCode: "31670",
    city: "Labège",
    latitude: 43.54505,
    longitude: 1.48948,
    price: 34.9,
    link: "https://www.onair-fitness.fr/clubs/toulouse-labege",
    amenities: ["Studio cycling", "Espace premium", "Sauna"],
  }),
  buildFallbackGym({
    id: "on-air-montpellier-saint-aunes",
    name: "On Air Montpellier Saint-Aunès",
    brand: "On Air",
    address: "295 Rue de la Jasse",
    postalCode: "34130",
    city: "Saint-Aunès",
    latitude: 43.63986,
    longitude: 3.96912,
    price: 34.9,
    link: "https://www.onair-fitness.fr/clubs/montpellier-saint-aunes",
    amenities: ["Espace premium", "Cours collectifs", "Zone cross training"],
  }),
  buildFallbackGym({
    id: "on-air-lyon-confluence",
    name: "On Air Lyon Confluence",
    brand: "On Air",
    address: "112 Cours Charlemagne",
    postalCode: "69002",
    city: "Lyon",
    latitude: 45.73285,
    longitude: 4.81945,
    price: 39.9,
    link: "https://www.onair-fitness.fr/clubs/lyon-confluence",
    amenities: ["Espace premium", "Studio cycling", "Cours collectifs"],
  }),
]);

const extractBasicFitStores = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.stores)) {
    return payload.stores;
  }

  if (Array.isArray(payload.data?.stores)) {
    return payload.data.stores;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const mapBasicFitStore = (store) => {
  const addressParts = [
    resolveField(store, ["address1", "address.address1", "adresse"]),
    resolveField(store, ["address2", "address.address2"]),
  ]
    .map((value) => normalizeString(value))
    .filter(Boolean);

  const address = addressParts.join(", ");
  const priceValue =
    resolveField(store, [
      "membershipPrice",
      "membership_price",
      "price",
      "prices[0].value",
      "prices[0].price",
      "pricing[0].price",
    ]) ?? null;

  const link = absoluteUrl(
    BASIC_FIT_BASE_URL,
    resolveField(store, ["detailsPageUrl", "url", "detailsURL", "detailsUri"]),
  );

  return createGymRecord({
    id: resolveField(store, ["ID", "id", "storeId"]),
    name: resolveField(store, ["name", "storeName", "displayName", "description"]),
    brand: "Basic-Fit",
    address,
    postalCode: resolveField(store, ["postalCode", "zip", "postal_code"]),
    city: resolveField(store, ["city", "town"]),
    latitude: resolveField(store, ["latitude", "lat", "coordinates.lat"]),
    longitude: resolveField(store, ["longitude", "lng", "coordinates.lng"]),
    price: priceValue,
    link,
    provider: "basic-fit",
    externalId: resolveField(store, ["ID", "id", "storeId"]),
    distanceKm: resolveField(store, ["distance", "distanceKm", "distance_km"]),
  });
};

const mapWordpressLocation = (entry, { brand, provider }) => {
  const acfPrice = resolveField(entry, [
    "acf.prix",
    "acf.tarif",
    "acf.tarifs",
    "acf.prix_mensuel",
    "acf.price",
    "acf.informations.prix",
  ]);

  const addressParts = [
    resolveField(entry, [
      "acf.adresse",
      "acf.address",
      "acf.adresse_complete",
      "acf.location.address",
      "acf.informations.adresse",
    ]),
    resolveField(entry, [
      "acf.code_postal",
      "acf.postal_code",
      "acf.location.zip",
      "acf.location.code_postal",
    ]),
    resolveField(entry, ["acf.ville", "acf.city", "acf.location.city"]),
  ]
    .map((value) => normalizeString(value))
    .filter(Boolean);

  const address = addressParts.join(", ");

  const latitude = resolveField(entry, [
    "acf.latitude",
    "acf.location.lat",
    "acf.map.lat",
    "acf.coordonnees.lat",
  ]);

  const longitude = resolveField(entry, [
    "acf.longitude",
    "acf.location.lng",
    "acf.map.lng",
    "acf.coordonnees.lng",
  ]);

  return createGymRecord({
    id: resolveField(entry, ["slug", "id"]),
    name: resolveField(entry, ["title.rendered", "name", "acf.nom"]),
    brand,
    address,
    postalCode: resolveField(entry, [
      "acf.code_postal",
      "acf.postal_code",
      "acf.location.zip",
      "acf.location.code_postal",
    ]),
    city: resolveField(entry, ["acf.ville", "acf.city", "acf.location.city", "acf.commune"]),
    latitude,
    longitude,
    price: acfPrice ?? resolveField(entry, ["acf.tarif_mensuel", "acf.subscription.price"]),
    link: resolveField(entry, ["link", "acf.lien", "acf.url"]),
    provider,
    externalId: resolveField(entry, ["id"]),
  });
};

const fetchBasicFitGymsInternal = async (filters = {}) => {
  if (!SearchParams) {
    throw new Error("URLSearchParams is not available in this runtime");
  }

  const query = new SearchParams({
    showMap: "true",
    radius: String(filters.maxDistanceKm ?? 50),
    maxdistance: String(filters.maxDistanceKm ?? 50),
    latitude: normalizeString(filters.lat ?? filters.latitude ?? 48.8566),
    longitude: normalizeString(filters.lng ?? filters.longitude ?? 2.3522),
    country: "FR",
  });

  if (filters.city) {
    query.set("searchTerm", filters.city);
  }

  const url = `${BASIC_FIT_ENDPOINT}?${query.toString()}`;

  try {
    const payload = await fetchJson(url);
    const stores = extractBasicFitStores(payload);
    const gyms = stores.map(mapBasicFitStore).filter(Boolean);
    return { gyms: deduplicateGyms(gyms), fallbackUsed: false };
  } catch (error) {
    globalThis.console?.warn?.("Failed to fetch Basic-Fit gyms", error);
    return { gyms: BASIC_FIT_FALLBACK.map((gym) => ({ ...gym })), fallbackUsed: true };
  }

  return { gyms: [], fallbackUsed: false };
};

const fetchFromWordpress = async (endpoints, mapper, fallbackGyms = []) => {
  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint);
      const entries = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
        ? payload.items
        : [];

      const gyms = entries.map(mapper).filter(Boolean);
      if (gyms.length > 0) {
        return { gyms: deduplicateGyms(gyms), fallbackUsed: false };
      }
    } catch (error) {
      globalThis.console?.warn?.(`Failed to fetch gyms from ${endpoint}`, error);
      continue;
    }
  }

  if (fallbackGyms.length > 0) {
    return { gyms: fallbackGyms.map((gym) => ({ ...gym })), fallbackUsed: true };
  }

  return { gyms: [], fallbackUsed: false };
};
const fetchFitnessParkGymsInternal = async () => {
  const mapper = (entry) =>
    mapWordpressLocation(entry, { brand: "Fitness Park", provider: "fitness-park" });
  return fetchFromWordpress(FITNESS_PARK_ENDPOINTS, mapper, FITNESS_PARK_FALLBACK);
};

const fetchNeonessGymsInternal = async () => {
  const mapper = (entry) => mapWordpressLocation(entry, { brand: "Neoness", provider: "neoness" });
  return fetchFromWordpress(NEONESS_ENDPOINTS, mapper, NEONESS_FALLBACK);
};

const fetchOnAirGymsInternal = async () => {
  const mapper = (entry) => mapWordpressLocation(entry, { brand: "On Air", provider: "on-air" });
  return fetchFromWordpress(ON_AIR_ENDPOINTS, mapper, ON_AIR_FALLBACK);
};

const buildCombinedDataset = async (filters = {}) => {
  const [basicFit, fitnessPark, neoness, onAir] = await Promise.all([
    fetchBasicFitGymsInternal(filters),
    fetchFitnessParkGymsInternal(),
    fetchNeonessGymsInternal(),
    fetchOnAirGymsInternal(),
  ]);

  const combined = flatten([basicFit.gyms, fitnessPark.gyms, neoness.gyms, onAir.gyms]);
  const gyms = deduplicateGyms(combined);

  const servedFrom =
    basicFit.fallbackUsed || fitnessPark.fallbackUsed || neoness.fallbackUsed || onAir.fallbackUsed
      ? "fallback"
      : "api";

  return {
    gyms,
    servedFrom,
  };
};

const normalizeFilterInput = (latOrFilters, maybeLng) => {
  if (latOrFilters && typeof latOrFilters === "object" && !Array.isArray(latOrFilters)) {
    return latOrFilters;
  }

  const result = {};

  if (typeof latOrFilters === "number" && Number.isFinite(latOrFilters)) {
    result.lat = latOrFilters;
  }

  if (typeof maybeLng === "number" && Number.isFinite(maybeLng)) {
    result.lng = maybeLng;
  }

  return result;
};

export const fetchBasicFitGyms = async (latOrFilters, maybeLng) => {
  const filters = normalizeFilterInput(latOrFilters, maybeLng);
  const result = await fetchBasicFitGymsInternal(filters);
  return result.gyms;
};

export const fetchFitnessParkGyms = async () => {
  const result = await fetchFitnessParkGymsInternal();
  return result.gyms;
};

export const fetchNeonessGyms = async () => {
  const result = await fetchNeonessGymsInternal();
  return result.gyms;
};

export const fetchOnAirGyms = async () => {
  const result = await fetchOnAirGymsInternal();
  return result.gyms;
};

export const getAllGyms = async (latOrFilters = {}, maybeLng) => {
  const rawFilters = normalizeFilterInput(latOrFilters, maybeLng);
  const filters = sanitizeFilters(rawFilters);
  const { gyms, servedFrom } = await buildCombinedDataset(filters);

  const enriched = enrichWithGeo(gyms, filters);

  const limitedFilters = { ...filters };
  const limit = typeof limitedFilters.limit === "number" ? limitedFilters.limit : undefined;
  if (limit != null) {
    limitedFilters.limit = undefined;
  }

  const filteredWithoutLimit = filterGyms(enriched, limitedFilters);
  const finalGyms = limit ? filteredWithoutLimit.slice(0, limit) : filteredWithoutLimit;

  return {
    gyms: finalGyms,
    availableCities: collectCities(enriched),
    count: finalGyms.length,
    total: filteredWithoutLimit.length,
    filters,
    servedFrom,
  };
};

export default {
  fetchBasicFitGyms,
  fetchFitnessParkGyms,
  fetchNeonessGyms,
  fetchOnAirGyms,
  getAllGyms,
};
