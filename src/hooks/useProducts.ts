import { useQuery } from '@tanstack/react-query';

import type { Product } from '../data/products';
import { products } from '../data/products';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useProducts = () =>
  useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      await wait(400);
      return products;
    },
    staleTime: 1000 * 60 * 5,
  });
