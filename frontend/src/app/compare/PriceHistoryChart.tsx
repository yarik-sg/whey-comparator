"use client";

import { useId, useMemo } from "react";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

interface PriceHistoryChartDatum {
  date: string;
  price: number | null;
}

interface PriceHistoryChartProps {
  data: PriceHistoryChartDatum[];
}

type ChartPoint = {
  x: number;
  y: number;
  price: number;
  dateLabel: string;
  tooltip: string;
};

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
}

function formatTooltipLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function buildChart(data: PriceHistoryChartDatum[]):
  | {
      points: ChartPoint[];
      linePath: string;
      areaPath: string;
      min: number;
      max: number;
      avg: number;
    }
  | null {
  const filtered = data
    .filter((entry) => typeof entry.price === "number" && Number.isFinite(entry.price))
    .map((entry) => ({
      ...entry,
      dateLabel: formatDateLabel(entry.date),
      tooltip: formatTooltipLabel(entry.date),
      price: entry.price as number,
    }));

  if (filtered.length === 0) {
    return null;
  }

  const values = filtered.map((entry) => entry.price);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((total, value) => total + value, 0) / values.length;
  const span = max - min || 1;
  const lastIndex = filtered.length - 1 || 1;

  const points: ChartPoint[] = filtered.map((entry, index) => {
    const x = filtered.length === 1 ? 50 : (index / lastIndex) * 100;
    const y = ((max - entry.price) / span) * 100;
    return {
      x,
      y,
      price: entry.price,
      dateLabel: entry.dateLabel,
      tooltip: entry.tooltip,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const firstX = points[0]?.x ?? 0;
  const lastX = points[points.length - 1]?.x ?? 100;
  const areaPath = `${linePath} L ${lastX} 100 L ${firstX} 100 Z`;

  return { points, linePath, areaPath, min, max, avg };
}

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const chart = useMemo(() => buildChart(data), [data]);
  const gradientId = useId();

  if (!chart) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 text-sm text-[color:var(--muted)]">
        Données insuffisantes pour afficher le graphique.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/40 p-4">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6600" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF6600" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <path d={chart.linePath} fill="none" stroke="#FF6600" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
        <ul className="pointer-events-none absolute inset-0 flex items-end justify-between px-4 pb-2 text-[10px] uppercase tracking-wide text-[color:var(--muted)]">
          <li>{chart.points[0]?.dateLabel}</li>
          <li>{chart.points.at(-1)?.dateLabel}</li>
        </ul>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
          <dt className="text-xs text-[color:var(--muted)]">Min.</dt>
          <dd className="font-semibold text-[color:var(--text-strong)]">{priceFormatter.format(chart.min)}</dd>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
          <dt className="text-xs text-[color:var(--muted)]">Moyenne</dt>
          <dd className="font-semibold text-[color:var(--text-strong)]">{priceFormatter.format(chart.avg)}</dd>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3">
          <dt className="text-xs text-[color:var(--muted)]">Max.</dt>
          <dd className="font-semibold text-[color:var(--text-strong)]">{priceFormatter.format(chart.max)}</dd>
        </div>
      </dl>
    </div>
  );
}
