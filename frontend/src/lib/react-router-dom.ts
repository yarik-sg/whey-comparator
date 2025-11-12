"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  getCompareNavigationState,
  subscribeToCompareNavigationState,
  type CompareNavigationState,
} from "@/lib/compareNavigation";

interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
  state: CompareNavigationState | null | undefined;
  key: string;
}

const LOCATION_KEY = "fitidion";

export function useLocation(): LocationLike {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchString = useMemo(() => {
    if (!searchParams) {
      return "";
    }
    const value = searchParams.toString();
    return value.length > 0 ? `?${value}` : "";
  }, [searchParams]);

  const [state, setState] = useState<CompareNavigationState | null | undefined>(() =>
    getCompareNavigationState(),
  );

  useEffect(() => {
    setState(getCompareNavigationState());
    const unsubscribe = subscribeToCompareNavigationState((nextState) => {
      setState(nextState ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setState(getCompareNavigationState());
  }, [pathname, searchString]);

  return {
    pathname,
    search: searchString,
    hash: "",
    state,
    key: LOCATION_KEY,
  };
}
