"use client";

import dynamic from "next/dynamic";

import type { PriceHistoryChartDatum } from "./PriceHistoryChart";

const LazyPriceHistoryChart = dynamic(() => import("./PriceHistoryChart"), {
  ssr: false,
  loading: () => (
    <section className="space-y-4 rounded-3xl border border-accent/70 bg-background p-6 text-sm text-muted">
      Chargement du graphique…
    </section>
  ),
});

interface PriceHistoryChartClientProps {
  data: PriceHistoryChartDatum[];
  className?: string;
}

export function PriceHistoryChartClient(props: PriceHistoryChartClientProps) {
  return <LazyPriceHistoryChart {...props} />;
}
