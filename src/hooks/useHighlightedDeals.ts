import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { normalizeDeal, type Deal, type RawDeal } from '../data/products';
import { fetchFromApi } from '../lib/api';

const STORAGE_KEY = 'whey-comparator::highlighted-deals';

const loadCachedDeals = (): Deal[] | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.filter((item): item is Deal => Boolean(item && typeof item === 'object'));
  } catch (error) {
    console.warn('Unable to read cached highlighted deals', error);
    return undefined;
  }
};

const saveCachedDeals = (deals: Deal[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch (error) {
    console.warn('Unable to cache highlighted deals', error);
  }
};

const fetchHighlightedDeals = async (): Promise<Deal[]> => {
  try {
    const payload = (await fetchFromApi('/compare?q=whey%20protein&limit=9')) as unknown;
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .filter((item): item is RawDeal => item && typeof item === 'object')
      .map((deal) => normalizeDeal(deal))
      .slice(0, 9);
  } catch (error) {
    console.error('Failed to load highlighted deals', error);
    return [];
  }
};

export const useHighlightedDeals = () => {
  const initialData = loadCachedDeals;
  const query = useQuery<Deal[]>({
    queryKey: ['highlighted-deals'],
    queryFn: fetchHighlightedDeals,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    initialData,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      saveCachedDeals(query.data);
    }
  }, [query.data]);

  return query;
};
