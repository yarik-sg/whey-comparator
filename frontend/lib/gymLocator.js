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
    return deduplicateGyms(gyms);
  } catch (error) {
    globalThis.console?.warn?.("Failed to fetch Basic-Fit gyms", error);
  }

  return [];
};

const fetchFromWordpress = async (endpoints, mapper) => {
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
        return deduplicateGyms(gyms);
      }
    } catch (error) {
      globalThis.console?.warn?.(`Failed to fetch gyms from ${endpoint}`, error);
      continue;
    }
  }

  return [];
};
const fetchFitnessParkGymsInternal = async () => {
  const mapper = (entry) =>
    mapWordpressLocation(entry, { brand: "Fitness Park", provider: "fitness-park" });
  return fetchFromWordpress(FITNESS_PARK_ENDPOINTS, mapper);
};

const fetchNeonessGymsInternal = async () => {
  const mapper = (entry) => mapWordpressLocation(entry, { brand: "Neoness", provider: "neoness" });
  return fetchFromWordpress(NEONESS_ENDPOINTS, mapper);
};

const fetchOnAirGymsInternal = async () => {
  const mapper = (entry) => mapWordpressLocation(entry, { brand: "On Air", provider: "on-air" });
  return fetchFromWordpress(ON_AIR_ENDPOINTS, mapper);
};

const buildCombinedDataset = async (filters = {}) => {
  const [basicFit, fitnessPark, neoness, onAir] = await Promise.all([
    fetchBasicFitGymsInternal(filters),
    fetchFitnessParkGymsInternal(),
    fetchNeonessGymsInternal(),
    fetchOnAirGymsInternal(),
  ]);

  const combined = flatten([basicFit, fitnessPark, neoness, onAir]);
  const gyms = deduplicateGyms(combined);

  return {
    gyms,
    servedFrom: "api",
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
  return fetchBasicFitGymsInternal(filters);
};

export const fetchFitnessParkGyms = async () => fetchFitnessParkGymsInternal();

export const fetchNeonessGyms = async () => fetchNeonessGymsInternal();

export const fetchOnAirGyms = async () => fetchOnAirGymsInternal();

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
