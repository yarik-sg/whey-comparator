"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

export default function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const dataset = useMemo(
    () =>
      data
        .filter((entry) => typeof entry.price === "number" && Number.isFinite(entry.price))
        .map((entry) => ({
          ...entry,
          label: formatDateLabel(entry.date),
        })),
    [data],
  );

  if (dataset.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 text-sm text-[color:var(--muted)]">
        Données insuffisantes pour afficher le graphique.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={dataset} margin={{ top: 10, right: 24, bottom: 10, left: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6600" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.3)" />
        <XAxis dataKey="date" tickFormatter={formatDateLabel} stroke="rgba(148, 163, 184, 0.9)" fontSize={12} />
        <YAxis
          stroke="rgba(148, 163, 184, 0.9)"
          fontSize={12}
          tickFormatter={(value: number) => priceFormatter.format(value)}
        />
        <Tooltip
          cursor={{ stroke: "#FF6600", strokeWidth: 1, strokeDasharray: "4 4" }}
          formatter={(value: number | string) =>
            typeof value === "number" ? priceFormatter.format(value) : value
          }
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: "var(--surface)",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-soft)",
            color: "var(--text)",
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="#FF6600"
          strokeWidth={2}
          fill="url(#priceGradient)"
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
