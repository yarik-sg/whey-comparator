"use client";

import { useContext } from "react";

import { AnalyticsContext, type AnalyticsContextValue } from "@/components/AnalyticsProvider";

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }

  return context;
}
