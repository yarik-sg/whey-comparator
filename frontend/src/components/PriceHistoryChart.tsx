"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usePriceHistory } from "@/lib/queries";
import type { PriceHistoryResponse } from "@/types/api";

const PERIOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "1m", label: "1 mois" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "1y", label: "1 an" },
  { value: "all", label: "Tout" },
];

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

const tooltipFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function buildChartData(history: PriceHistoryResponse | undefined) {
  if (!history) {
    return [];
  }

  return history.points
    .map((point) => ({
      date: new Date(point.recordedAt),
      price: point.price.amount ?? 0,
      formatted: point.price.formatted ?? "",
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface PriceHistoryChartProps {
  productId: number;
  defaultPeriod?: string;
}

export function PriceHistoryChart({ productId, defaultPeriod = "3m" }: PriceHistoryChartProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const { data, isLoading, isFetching, error } = usePriceHistory(productId, period);

  const chartData = useMemo(() => buildChartData(data), [data]);
  const isBusy = isLoading || isFetching;

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Historique des prix</h2>
          <p className="text-sm text-gray-300">Suivi journalier du meilleur prix relevé par le scraper.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          Période
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => {
              const active = option.value === period;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    active
                      ? "bg-orange-500 text-white shadow"
                      : "bg-white/10 text-gray-200 hover:bg-white/20"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {error && (
        <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">
          Impossible de charger l&apos;historique des prix. Réessayez plus tard.
        </p>
      )}

      {isBusy && (
        <div className="h-60 animate-pulse rounded-xl bg-white/10" aria-hidden />
      )}

      {!isBusy && chartData.length > 0 && (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: Date) => dateFormatter.format(value)}
                stroke="rgba(255,255,255,0.6)"
                tickLine={false}
              />
              <YAxis
                dataKey="price"
                stroke="rgba(255,255,255,0.6)"
                tickFormatter={(value: number) => `${value.toFixed(0)} €`}
                width={60}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const dataPoint = payload[0].payload as { date: Date; formatted: string };
                  return (
                    <div className="rounded-lg border border-white/10 bg-[#0b1320] px-3 py-2 text-sm text-white shadow-lg">
                      <p className="font-semibold">{dataPoint.formatted}</p>
                      <p className="text-xs text-gray-300">{tooltipFormatter.format(dataPoint.date)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#f97316"
                fill="url(#priceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isBusy && chartData.length === 0 && (
        <p className="text-sm text-gray-300">Pas encore de données historiques pour ce produit.</p>
      )}

      {data && (
        <dl className="grid gap-4 rounded-xl bg-white/5 p-4 text-sm text-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["Prix actuel", data.statistics.current],
            ["Plus bas", data.statistics.lowest],
            ["Plus haut", data.statistics.highest],
            ["Moyenne", data.statistics.average],
          ] as const).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
              <dd className="text-base font-semibold text-white">{value.formatted ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
