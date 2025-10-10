"use client";

import { useQuery } from "@tanstack/react-query";

import type { GymLocatorResponse, GymQueryFilters } from "@/lib/gymLocator";
import { fetchGyms } from "@/lib/gymLocator";

const buildQueryKey = (filters: GymQueryFilters = {}) => {
  return [
    "gyms",
    filters.city?.toLowerCase() ?? null,
    typeof filters.maxDistanceKm === "number" ? Number(filters.maxDistanceKm.toFixed(1)) : null,
    typeof filters.lat === "number" ? Number(filters.lat.toFixed(4)) : null,
    typeof filters.lng === "number" ? Number(filters.lng.toFixed(4)) : null,
    typeof filters.limit === "number" ? filters.limit : null,
  ];
};

export const useGyms = (filters: GymQueryFilters = {}) => {
  return useQuery<GymLocatorResponse, Error>({
    queryKey: buildQueryKey(filters),
    queryFn: () => fetchGyms(filters),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    keepPreviousData: true,
  });
};

export default useGyms;
