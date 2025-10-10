import { useQuery } from '@tanstack/react-query';

import type { GymLocatorResponse, GymQueryFilters } from '../lib/gymLocator';
import { fetchGyms } from '../lib/gymLocator';

const buildQueryKey = (filters: GymQueryFilters = {}) => {
  return [
    'gyms',
    filters.city?.toLowerCase() ?? null,
    typeof filters.maxDistanceKm === 'number' ? Number(filters.maxDistanceKm.toFixed(1)) : null,
    typeof filters.lat === 'number' ? Number(filters.lat.toFixed(4)) : null,
    typeof filters.lng === 'number' ? Number(filters.lng.toFixed(4)) : null,
    typeof filters.limit === 'number' ? filters.limit : null,
  ];
};

const sanitizeFilters = (filters: GymQueryFilters = {}): GymQueryFilters => {
  const normalized: GymQueryFilters = {};

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

  return normalized;
};

export const useGyms = (filters: GymQueryFilters = {}) => {
  const normalized = sanitizeFilters(filters);

  return useQuery<GymLocatorResponse>({
    queryKey: buildQueryKey(normalized),
    queryFn: () => fetchGyms(normalized),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    keepPreviousData: true,
  });
};
