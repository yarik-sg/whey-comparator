import { useQuery } from '@tanstack/react-query';

import { normalizeDeal, type Deal, type RawDeal } from '../data/products';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const fetchHighlightedDeals = async (): Promise<Deal[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL.replace(/\/$/, '')}/compare?q=whey%20protein&limit=9`,
    );

    if (!response.ok) {
      console.error('Unable to fetch highlighted deals', response.status, response.statusText);
      return [];
    }

    const payload = (await response.json()) as unknown;
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

export const useHighlightedDeals = () =>
  useQuery<Deal[]>({
    queryKey: ['highlighted-deals'],
    queryFn: fetchHighlightedDeals,
    staleTime: 1000 * 60 * 10,
  });
