import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  normalizeProduct,
  type Product,
  type ProductListResponse,
  type RawProduct,
} from '../data/products';
import { fetchFromApi } from '../lib/api';

const STORAGE_KEY = 'whey-comparator::products';

const loadCachedProducts = (): Product[] | undefined => {
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

    return parsed.filter((item): item is Product => Boolean(item && typeof item === 'object'));
  } catch (error) {
    console.warn('Unable to read cached products from sessionStorage', error);
    return undefined;
  }
};

const saveCachedProducts = (products: Product[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.warn('Unable to cache products in sessionStorage', error);
  }
};

const fetchProducts = async (): Promise<Product[]> => {
  try {
    const payload = await fetchFromApi<ProductListResponse>('/products?per_page=48');
    const items = Array.isArray(payload.products)
      ? payload.products
      : Array.isArray((payload as { items?: RawProduct[] }).items)
        ? (payload as { items?: RawProduct[] }).items ?? []
        : [];
    return items.map((product: RawProduct) => normalizeProduct(product));
  } catch (error) {
    console.error('Failed to load products', error);
    return [];
  }
};

export const useProducts = () => {
  const initialData = loadCachedProducts;
  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    initialData,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      saveCachedProducts(query.data);
    }
  }, [query.data]);

  return query;
};
