import { useQuery } from '@tanstack/react-query';

import {
  normalizeProduct,
  type Product,
  type ProductListResponse,
  type RawProduct,
} from '../data/products';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/products?per_page=48`);
    if (!response.ok) {
      console.error('Unable to fetch products from API', response.status, response.statusText);
      return [];
    }

    const payload = (await response.json()) as ProductListResponse;
    const items = Array.isArray(payload.products) ? payload.products : [];
    return items.map((product: RawProduct) => normalizeProduct(product));
  } catch (error) {
    console.error('Failed to load products', error);
    return [];
  }
};

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });
