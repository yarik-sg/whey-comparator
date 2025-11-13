"use client";

import { useId, useMemo } from "react";

export type PriceHistoryChartDatum = {
  recorded_at: string;
  price: number;
  platform?: string | null;
  currency?: string | null;
};

interface PriceHistoryChartProps {
  data: PriceHistoryChartDatum[];
  className?: string;
}

type ChartPoint = {
  x: number;
  y: number;
  price: number;
  label: string;
  tooltip: string;
};

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

const FULL_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function buildChart(data: PriceHistoryChartDatum[]):
  | {
      points: ChartPoint[];
      linePath: string;
      areaPath: string;
      currency: string;
      min: number;
      max: number;
      avg: number;
    }
  | null {
  const cleaned = data
    .filter((item) => typeof item.price === "number" && Number.isFinite(item.price))
    .map((item) => {
      const date = new Date(item.recorded_at);
      return {
        ...item,
        date,
        label: SHORT_DATE.format(date),
        tooltip: FULL_DATE.format(date),
        price: item.price,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (cleaned.length === 0) {
    return null;
  }

  const currency = cleaned[0]?.currency ?? "EUR";
  const values = cleaned.map((item) => item.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((total, value) => total + value, 0) / values.length;
  const span = max - min || 1;
  const lastIndex = cleaned.length - 1 || 1;

  const points: ChartPoint[] = cleaned.map((item, index) => {
    const x = cleaned.length === 1 ? 50 : (index / lastIndex) * 100;
    const y = ((max - item.price) / span) * 100;
    return {
      x,
      y,
      price: item.price,
      label: item.label,
      tooltip: item.tooltip,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const firstX = points[0]?.x ?? 0;
  const lastX = points[points.length - 1]?.x ?? 100;
  const areaPath = `${linePath} L ${lastX} 100 L ${firstX} 100 Z`;

  return { points, linePath, areaPath, currency, min, max, avg };
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function PriceHistoryChartComponent({ data, className }: PriceHistoryChartProps) {
  const chart = useMemo(() => buildChart(data), [data]);
  const gradientId = useId();

  const containerClasses = [
    "space-y-4 rounded-3xl border border-accent/70 bg-background p-6 shadow-sm",
    className ?? "",
  ]
    .join(" ")
    .trim();

  if (!chart) {
    return (
      <section className={containerClasses}>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-dark">Historique des prix</h2>
          <p className="text-sm text-muted">Dernières variations (30 relevés maximum).</p>
        </div>
        <p className="rounded-xl border border-dashed border-accent/70 p-6 text-center text-sm text-muted">
          Pas encore d’historique pour ce produit.
        </p>
      </section>
    );
  }

  return (
    <section className={containerClasses}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-dark">Historique des prix</h2>
        <p className="text-sm text-muted">Dernières variations (30 relevés maximum).</p>
      </div>
      <div className="space-y-4">
        <div className="relative h-72 overflow-hidden rounded-2xl border border-accent/50 bg-white/70 p-4">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6600" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.areaPath} fill={`url(#${gradientId})`} stroke="none" />
            <path d={chart.linePath} fill="none" stroke="#FF6600" strokeWidth={3} strokeLinecap="round" />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-end justify-between px-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
            <span>{chart.points[0]?.label}</span>
            <span>{chart.points.at(-1)?.label}</span>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-2xl border border-accent/50 bg-white/80 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Min.</dt>
            <dd className="text-lg font-semibold text-dark">{formatCurrency(chart.min, chart.currency)}</dd>
          </div>
          <div className="rounded-2xl border border-accent/50 bg-white/80 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Moyenne</dt>
            <dd className="text-lg font-semibold text-dark">{formatCurrency(chart.avg, chart.currency)}</dd>
          </div>
          <div className="rounded-2xl border border-accent/50 bg-white/80 p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">Max.</dt>
            <dd className="text-lg font-semibold text-dark">{formatCurrency(chart.max, chart.currency)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export default PriceHistoryChartComponent;
export { PriceHistoryChartComponent as PriceHistoryChart };
