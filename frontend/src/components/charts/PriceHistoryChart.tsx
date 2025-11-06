"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function PriceHistoryChartComponent({ data, className }: PriceHistoryChartProps) {
  const preparedData = useMemo(() => {
    return data
      .filter((item) => typeof item.price === "number" && Number.isFinite(item.price))
      .map((item) => {
        const date = new Date(item.recorded_at);
        return {
          ...item,
          currency: item.currency ?? "EUR",
          date,
          label: SHORT_DATE.format(date),
          tooltip: FULL_DATE.format(date),
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  const currency = preparedData[0]?.currency ?? "EUR";
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }),
    [currency],
  );

  const containerClasses = [
    "space-y-4 rounded-3xl border border-accent/70 bg-background p-6 shadow-sm",
    className ?? "",
  ]
    .join(" ")
    .trim();

  if (preparedData.length === 0) {
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
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={preparedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} />
            <YAxis
              stroke="#94a3b8"
              width={80}
              tickFormatter={(value: number) => formatter.format(value)}
            />
            <Tooltip
              formatter={(value: number | string) =>
                typeof value === "number" ? formatter.format(value) : value
              }
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as (typeof preparedData)[number] | undefined;
                return point?.tooltip ?? "";
              }}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 12,
                borderColor: "#e2e8f0",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              }}
              labelStyle={{ color: "#1e293b", fontWeight: 600 }}
              itemStyle={{ color: "#475569" }}
            />
            <Line type="monotone" dataKey="price" stroke="#FF6600" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default PriceHistoryChartComponent;
export { PriceHistoryChartComponent as PriceHistoryChart };
