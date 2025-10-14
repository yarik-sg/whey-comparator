"use client";

import { useMemo, useState } from "react";
import { Calendar, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
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

const PERIOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "1y", label: "1 an" },
  { value: "all", label: "Tout" },
];

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const FULL_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface PriceHistoryChartProps {
  productId: number;
  defaultPeriod?: string;
}

export function PriceHistoryChart({ productId, defaultPeriod = "30d" }: PriceHistoryChartProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  const { data, isLoading } = usePriceHistory(productId, period);

  const currency = data?.history?.[0]?.currency ?? "EUR";
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }),
    [currency],
  );

  const chartData = useMemo(() => {
    if (!data?.history) {
      return [];
    }

    return data.history
      .map((entry) => {
        const date = new Date(entry.date);
        return {
          date,
          label: SHORT_DATE.format(date),
          tooltip: FULL_DATE.format(date),
          price: entry.price,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  const statistics = data?.statistics ?? null;
  const hasHistory = chartData.length > 0;
  const showHistoricLow = Boolean(statistics?.is_historical_low);

  const TrendIcon = statistics?.trend === "hausse" ? TrendingUp : TrendingDown;
  const trendColor =
    statistics?.trend === "hausse"
      ? "text-emerald-500"
      : statistics?.trend === "baisse"
        ? "text-red-500"
        : "text-muted";

  return (
    <section className="space-y-6 rounded-2xl border border-accent/70 bg-background p-6 shadow-sm">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-muted">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-primary">
            <Calendar className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark">Historique des prix</h2>
            <p className="text-sm text-muted">
              Suivi de l&apos;évolution du meilleur tarif détecté sur les places de marché partenaires.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option.value === period;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  isActive
                    ? "bg-primary text-white shadow"
                    : "bg-accent/70 text-muted hover:bg-accent/60"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {showHistoricLow && statistics && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden />
          <div>
            <p className="font-semibold">Prix historiquement bas</p>
            <p className="text-xs">C&apos;est le moment idéal pour déclencher une alerte ou acheter.</p>
          </div>
        </div>
      )}

      {statistics && (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-accent/70 bg-accent p-4 text-sm text-muted">
          <div className="flex flex-1 min-w-[140px] items-center gap-2">
            <TrendIcon className={`h-5 w-5 ${trendColor}`} aria-hidden />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted/80">Tendance</p>
              <p className="font-semibold text-dark">
                {statistics.trend === "stable"
                  ? "Stable"
                  : statistics.trend === "hausse"
                    ? "Hausse"
                    : "Baisse"}
                {typeof statistics.price_change_percent === "number" && !Number.isNaN(statistics.price_change_percent) && (
                  <span className={`ml-2 text-xs font-medium ${trendColor}`}>
                    {statistics.price_change_percent > 0 ? "+" : ""}
                    {statistics.price_change_percent.toFixed(2)}%
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="grid flex-1 min-w-[200px] grid-cols-2 gap-4">
            {[{
              label: "Actuel",
              value: statistics.current_price,
            },
            {
              label: "Plus bas",
              value: statistics.lowest_price,
            },
            {
              label: "Plus haut",
              value: statistics.highest_price,
            },
            {
              label: "Moyenne",
              value: statistics.average_price,
            }].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs uppercase tracking-wide text-muted/80">{label}</p>
                <p className="text-base font-semibold text-dark">{formatter.format(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && <div className="h-64 animate-pulse rounded-xl bg-accent/70" aria-hidden />}

      {!isLoading && hasHistory && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tickLine={false} stroke="#94a3b8" />
              <YAxis
                dataKey="price"
                width={70}
                stroke="#94a3b8"
                tickFormatter={(value: number) => formatter.format(value)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }
                  const point = payload[0].payload as {
                    tooltip: string;
                    price: number;
                  };
                  return (
                    <div className="rounded-xl border border-accent/70 bg-background px-4 py-3 text-sm text-muted shadow-lg">
                      <p className="font-semibold text-dark">{point.tooltip}</p>
                      <p className="text-xs text-muted">{formatter.format(point.price)}</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={3} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && !hasHistory && (
        <div className="rounded-xl border border-dashed border-accent/70 p-6 text-center text-sm text-muted">
          Historique de prix non disponible pour cette période.
        </div>
      )}
    </section>
  );
}
