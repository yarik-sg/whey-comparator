"use client";

import { useEffect, useRef } from "react";

import { useAnalytics } from "@/hooks/useAnalytics";

interface ProductAnalyticsTrackerProps {
  productId: string;
  name: string;
  brand?: string | null;
}

export function ProductAnalyticsTracker({ productId, name, brand }: ProductAnalyticsTrackerProps) {
  const { trackProductView } = useAnalytics();
  const lastTrackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!productId || lastTrackedId.current === productId) {
      return;
    }

    lastTrackedId.current = productId;

    trackProductView({
      productId,
      name,
      brand: brand ?? null,
    });
  }, [brand, name, productId, trackProductView]);

  return null;
}
