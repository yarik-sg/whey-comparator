"use client";

import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramSummary } from "@/types/api";

function formatDuration(durationWeeks?: number | null, sessionsPerWeek?: number | null) {
  const parts: string[] = [];

  if (typeof durationWeeks === "number" && Number.isFinite(durationWeeks)) {
    const rounded = Math.round(durationWeeks);
    parts.push(`${rounded} semaine${rounded > 1 ? "s" : ""}`);
  }

  if (typeof sessionsPerWeek === "number" && Number.isFinite(sessionsPerWeek)) {
    const rounded = Math.round(sessionsPerWeek);
    parts.push(`${rounded} séance${rounded > 1 ? "s" : ""}/semaine`);
  }

  return parts.join(" • ");
}

function formatPriceLabel(price?: ProgramSummary["price"]) {
  if (!price) {
    return "Disponible prochainement";
  }

  if (price.formatted) {
    return price.formatted;
  }

  if (typeof price.amount === "number" && Number.isFinite(price.amount)) {
    const currency = price.currency ?? "EUR";
    const formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(price.amount);
  }

  return "Disponible prochainement";
}

interface ProgramCardProps {
  program: ProgramSummary;
}

export function ProgramCard({ program }: ProgramCardProps) {
  const {
    name,
    focus,
    level,
    description,
    durationWeeks,
    sessionsPerWeek,
    intensity,
    equipmentNeeded,
    coach,
    price,
    link,
  } = program;

  const formattedDuration = formatDuration(durationWeeks, sessionsPerWeek);
  const priceLabel = formatPriceLabel(price);
  const equipmentList = (equipmentNeeded ?? []).filter((item): item is string => Boolean(item));

  return (
    <Card className="flex h-full flex-col justify-between border-accent/60 bg-background/90 text-dark shadow-sm transition hover:border-primary/40 hover:shadow-lg dark:border-accent-d/40 dark:bg-dark/80 dark:text-[var(--text)]">
      <CardHeader className="space-y-3">
        {focus ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary">
            {focus}
          </span>
        ) : null}
        <CardTitle className="text-xl font-semibold text-dark dark:text-[var(--text)]">{name}</CardTitle>
        {coach ? <p className="text-xs text-muted">Coach : {coach}</p> : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted">
        {description ? <p className="leading-relaxed text-muted">{description}</p> : null}
        <dl className="grid grid-cols-2 gap-4 text-sm text-muted">
          {level ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted/80">Niveau</dt>
              <dd className="font-semibold text-dark dark:text-[var(--text)]">{level}</dd>
            </div>
          ) : null}
          {formattedDuration ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted/80">Durée</dt>
              <dd className="font-semibold text-dark dark:text-[var(--text)]">{formattedDuration}</dd>
            </div>
          ) : null}
          {intensity ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted/80">Intensité</dt>
              <dd className="font-semibold text-dark dark:text-[var(--text)]">{intensity}</dd>
            </div>
          ) : null}
        </dl>
        {equipmentList.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted/80">Matériel requis</p>
            <ul className="flex flex-wrap gap-2">
              {equipmentList.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary dark:bg-[rgba(148,163,184,0.18)] dark:text-[var(--text)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-accent/60 pt-4 text-sm text-muted dark:border-accent-d/40">
        <span className="font-semibold text-dark dark:text-[var(--text)]">{priceLabel}</span>
        {link ? (
          <Link
            href={link}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
          >
            Voir le programme
          </Link>
        ) : null}
      </CardFooter>
    </Card>
  );
}
