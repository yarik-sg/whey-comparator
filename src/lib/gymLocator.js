import { buildApiUrl } from './api';

const normalizeAmenity = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const normalizeNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return value;
};

const MOCK_GYMS = [
  {
    id: 'basicfit-paris-bercy',
    name: 'Basic-Fit Paris Bercy',
    brand: 'Basic-Fit',
    address: '24 Rue de Bercy',
    postal_code: '75012',
    city: 'Paris',
    latitude: 48.84005,
    longitude: 2.3831,
    distance_km: 1.1,
    monthly_price: 24.99,
    currency: 'EUR',
    website: 'https://www.basic-fit.com/fr-fr/clubs/basic-fit-paris-bercy',
    amenities: ['24/7', 'Cours collectifs virtuels', 'Zone functional training'],
    source: { provider: 'mock', brand: 'Basic-Fit' },
  },
  {
    id: 'fitnesspark-lyon-part-dieu',
    name: 'Fitness Park Lyon Part-Dieu',
    brand: 'Fitness Park',
    address: '91 Cours Lafayette',
    postal_code: '69006',
    city: 'Lyon',
    latitude: 45.76266,
    longitude: 4.85538,
    distance_km: 1.8,
    monthly_price: 29.95,
    currency: 'EUR',
    website: 'https://www.fitnesspark.fr/clubs/lyon-part-dieu/',
    amenities: ['Espace musculation', 'Cardio-training', 'Studio biking'],
    source: { provider: 'mock', brand: 'Fitness Park' },
  },
  {
    id: 'onair-marseille-prado',
    name: 'On Air Marseille Prado',
    brand: 'On Air',
    address: '6 Avenue du Prado',
    postal_code: '13006',
    city: 'Marseille',
    latitude: 43.28535,
    longitude: 5.37897,
    distance_km: 2.4,
    monthly_price: 34.9,
    currency: 'EUR',
    website: 'https://www.onair-fitness.fr/clubs/marseille-prado',
    amenities: ['Cours collectifs live', 'Espace cross training', 'Sauna'],
    source: { provider: 'mock', brand: 'On Air' },
  },
  {
    id: 'neoness-paris-chatelet',
    name: 'Neoness Paris Châtelet',
    brand: 'Neoness',
    address: '5 Rue de la Ferronnerie',
    postal_code: '75001',
    city: 'Paris',
    latitude: 48.86078,
    longitude: 2.34699,
    distance_km: 0.8,
    monthly_price: 19.9,
    currency: 'EUR',
    website: 'https://www.neoness.fr/salle-de-sport/paris-chatelet',
    amenities: ['Cardio', 'Cross-training', 'Studio danse'],
    source: { provider: 'mock', brand: 'Neoness' },
  },
  {
    id: 'keepcool-toulouse-capitole',
    name: 'Keepcool Toulouse Capitole',
    brand: 'Keepcool',
    address: '11 Rue du Poids de l’Huile',
    postal_code: '31000',
    city: 'Toulouse',
    latitude: 43.60398,
    longitude: 1.44329,
    distance_km: 0.6,
    monthly_price: 29.9,
    currency: 'EUR',
    website: 'https://www.keepcool.fr/salle-de-sport/toulouse-capitole',
    amenities: ['Small group training', 'Espace femme', 'Coaching inclus'],
    source: { provider: 'mock', brand: 'Keepcool' },
  },
  {
    id: 'basicfit-lille-euralille',
    name: 'Basic-Fit Lille Euralille',
    brand: 'Basic-Fit',
    address: '150 Centre Commercial Euralille',
    postal_code: '59777',
    city: 'Lille',
    latitude: 50.63709,
    longitude: 3.06971,
    distance_km: 1.5,
    monthly_price: 22.99,
    currency: 'EUR',
    website: 'https://www.basic-fit.com/fr-fr/clubs/basic-fit-lille-euralille',
    amenities: ['Zone cycle', 'Cours virtuels', 'Espace musculation'],
    source: { provider: 'mock', brand: 'Basic-Fit' },
  },
  {
    id: 'fitnesspark-bordeaux-lac',
    name: 'Fitness Park Bordeaux Lac',
    brand: 'Fitness Park',
    address: 'Rue du Professeur Georges Jeanneney',
    postal_code: '33300',
    city: 'Bordeaux',
    latitude: 44.88798,
    longitude: -0.56416,
    distance_km: 3.4,
    monthly_price: 29.95,
    currency: 'EUR',
    website: 'https://www.fitnesspark.fr/clubs/bordeaux-lac/',
    amenities: ['Parking gratuit', 'Studio biking', 'Zone cross training'],
    source: { provider: 'mock', brand: 'Fitness Park' },
  },
  {
    id: 'onair-nice-lingostiere',
    name: 'On Air Nice Lingostière',
    brand: 'On Air',
    address: '652 Route de Grenoble',
    postal_code: '06200',
    city: 'Nice',
    latitude: 43.70853,
    longitude: 7.19748,
    distance_km: 4.1,
    monthly_price: 39.9,
    currency: 'EUR',
    website: 'https://www.onair-fitness.fr/clubs/nice-lingostiere',
    amenities: ['Espace premium', 'Cours immersive', 'Studio cycling'],
    source: { provider: 'mock', brand: 'On Air' },
  },
];

const collectAvailableCities = (gyms) => {
  const cities = new Set();
  gyms.forEach((gym) => {
    const city = normalizeString(gym.city);
    if (city) {
      cities.add(city);
    }
  });
  return Array.from(cities).sort((a, b) => a.localeCompare(b, 'fr'));
};

const sanitizeFilters = (filters = {}) => {
  const normalized = {
    city: undefined,
    maxDistanceKm: undefined,
    lat: undefined,
    lng: undefined,
    limit: undefined,
  };

  if (filters && typeof filters === 'object') {
    if (typeof filters.city === 'string' && filters.city.trim().length > 0) {
      normalized.city = filters.city.trim();
    }

    if (typeof filters.maxDistanceKm === 'number' && Number.isFinite(filters.maxDistanceKm)) {
      normalized.maxDistanceKm = Math.max(filters.maxDistanceKm, 0);
    }

    if (typeof filters.lat === 'number' && Number.isFinite(filters.lat)) {
      normalized.lat = filters.lat;
    }

    if (typeof filters.lng === 'number' && Number.isFinite(filters.lng)) {
      normalized.lng = filters.lng;
    }

    if (typeof filters.limit === 'number' && Number.isFinite(filters.limit)) {
      normalized.limit = Math.max(Math.floor(filters.limit), 1);
    }
  }

  return normalized;
};

const normalizeGymRecord = (record, { fallbackProvider = 'mock' } = {}) => {
  const normalizedAmenities = Array.isArray(record?.amenities)
    ? record.amenities
        .map((amenity) => normalizeAmenity(amenity))
        .filter((amenity) => amenity !== null)
    : [];

  const monthlyPrice =
    normalizeNumber(record?.monthly_price) ??
    normalizeNumber(record?.monthlyPrice) ??
    normalizeNumber(record?.price_per_month);

  const latitude = normalizeNumber(record?.latitude);
  const longitude = normalizeNumber(record?.longitude);

  const distanceKm = normalizeNumber(record?.distance_km) ?? normalizeNumber(record?.distanceKm);

  const resolvedSource = (() => {
    if (record?.source && typeof record.source === 'object') {
      return {
        provider: normalizeString(record.source.provider) || fallbackProvider,
        brand: normalizeString(record.source.brand) || normalizeString(record.brand) || 'Gym',
        externalId: normalizeString(record.source.externalId || record.source.id) || undefined,
      };
    }
    return {
      provider: fallbackProvider,
      brand: normalizeString(record?.brand) || 'Gym',
    };
  })();

  return {
    id: normalizeString(record?.id) || normalizeString(record?.slug) || normalizeString(record?.name),
    name: normalizeString(record?.name) || 'Salle de sport',
    brand: normalizeString(record?.brand) || resolvedSource.brand,
    address: normalizeString(record?.address),
    postalCode: normalizeString(record?.postal_code || record?.postalCode),
    city: normalizeString(record?.city),
    latitude,
    longitude,
    distanceKm: distanceKm !== null ? Number.parseFloat(distanceKm.toFixed(2)) : null,
    travelTime: normalizeString(record?.estimated_duration || record?.travelTime) || null,
    monthlyPrice,
    currency: normalizeString(record?.currency) || 'EUR',
    website: normalizeString(record?.website || record?.url) || null,
    amenities: normalizedAmenities,
    images: Array.isArray(record?.images) ? record.images : [],
    source: resolvedSource,
    updatedAt: record?.updated_at ?? record?.updatedAt ?? null,
  };
};

const filterGymsLocally = (gyms, filters) => {
  const normalizedFilters = sanitizeFilters(filters);
  return gyms.filter((gym) => {
    if (normalizedFilters.city) {
      if (gym.city.toLowerCase() !== normalizedFilters.city.toLowerCase()) {
        return false;
      }
    }

    if (
      typeof normalizedFilters.maxDistanceKm === 'number' &&
      normalizedFilters.maxDistanceKm > 0 &&
      typeof gym.distanceKm === 'number'
    ) {
      if (gym.distanceKm > normalizedFilters.maxDistanceKm) {
        return false;
      }
    }

    return true;
  });
};

export const buildGymSearchParams = (filters = {}) => {
  const normalized = sanitizeFilters(filters);
  const params = new URLSearchParams();

  if (normalized.city) {
    params.set('city', normalized.city);
  }

  if (typeof normalized.maxDistanceKm === 'number' && normalized.maxDistanceKm > 0) {
    params.set('max_distance_km', normalized.maxDistanceKm.toString());
  }

  if (typeof normalized.lat === 'number' && typeof normalized.lng === 'number') {
    params.set('lat', normalized.lat.toString());
    params.set('lng', normalized.lng.toString());
  }

  if (typeof normalized.limit === 'number' && normalized.limit > 0) {
    params.set('limit', normalized.limit.toString());
  }

  return params;
};

const normalizeResponsePayload = (payload, filters) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const gyms = Array.isArray(payload.gyms)
    ? payload.gyms.map((gym) => normalizeGymRecord(gym, { fallbackProvider: 'api' }))
    : [];

  const availableCities = Array.isArray(payload.available_cities)
    ? payload.available_cities.map((city) => normalizeString(city)).filter((city) => city.length > 0)
    : collectAvailableCities(gyms);

  const count = typeof payload.count === 'number' ? payload.count : gyms.length;
  const total = typeof payload.total === 'number' ? payload.total : gyms.length;

  const resolvedFilters = {
    ...sanitizeFilters(filters),
    ...((payload.filters && typeof payload.filters === 'object')
      ? {
          city: normalizeString(payload.filters.city ?? filters?.city ?? ''),
          maxDistanceKm:
            normalizeNumber(payload.filters.max_distance_km ?? payload.filters.maxDistanceKm ?? filters?.maxDistanceKm) ??
            undefined,
        }
      : {}),
  };

  return {
    gyms,
    availableCities,
    count,
    total,
    filters: resolvedFilters,
  };
};

export const fetchGymsFromApi = async (filters = {}) => {
  const params = buildGymSearchParams(filters);
  const queryString = params.toString();
  const url = buildApiUrl(`/gyms${queryString ? `?${queryString}` : ''}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch gyms (${response.status})`);
  }

  const payload = await response.json();
  const normalized = normalizeResponsePayload(payload, filters);
  if (!normalized) {
    throw new Error('Received invalid payload for gyms API');
  }

  return normalized;
};

export const getFallbackGyms = (filters = {}) => {
  const gyms = MOCK_GYMS.map((gym) => normalizeGymRecord(gym));
  const filtered = filterGymsLocally(gyms, filters);
  const normalizedFilters = sanitizeFilters(filters);

  const limited =
    typeof normalizedFilters.limit === 'number' && normalizedFilters.limit > 0
      ? filtered.slice(0, normalizedFilters.limit)
      : filtered;

  return {
    gyms: limited,
    availableCities: collectAvailableCities(MOCK_GYMS),
    count: limited.length,
    total: filtered.length,
    filters: normalizedFilters,
    servedFrom: 'mock',
  };
};

export const fetchGyms = async (filters = {}) => {
  try {
    const data = await fetchGymsFromApi(filters);
    if (!data || data.gyms.length === 0) {
      return {
        ...getFallbackGyms(filters),
        servedFrom: 'fallback',
      };
    }
    return { ...data, servedFrom: 'api' };
  } catch (error) {
    console.warn('Falling back to mock gyms dataset', error);
    return getFallbackGyms(filters);
  }
};

export const mockGyms = MOCK_GYMS;

export default {
  fetchGyms,
  fetchGymsFromApi,
  getFallbackGyms,
  buildGymSearchParams,
  mockGyms,
};
