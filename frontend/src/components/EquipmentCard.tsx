"use client";

import Link from "next/link";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EquipmentSummary } from "@/types/api";

function resolvePriceLabel(price?: EquipmentSummary["price"]) {
  if (!price) {
    return "Tarif sur demande";
  }

  if (price.formatted) {
    return price.formatted;
  }

  if (typeof price.amount === "number" && Number.isFinite(price.amount)) {
    const currency = price.currency ?? "EUR";
    const formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    });
    return formatter.format(price.amount);
  }

  return "Tarif sur demande";
}

interface EquipmentCardProps {
  equipment: EquipmentSummary;
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const {
    name,
    brand,
    category,
    description,
    highlights,
    price,
    bestVendor,
    rating,
    reviewsCount,
    image,
    link,
  } = equipment;

  const priceLabel = resolvePriceLabel(price);
  const highlightList = (highlights ?? []).filter((item): item is string => Boolean(item));

  return (
    <Card className="flex h-full flex-col justify-between border-accent/60 bg-background/90 text-dark shadow-sm transition hover:border-primary/40 hover:shadow-lg dark:border-accent-d/40 dark:bg-dark/80 dark:text-[var(--text)]">
      <CardHeader className="space-y-3">
        {category ? (
          <span className="inline-flex items-center rounded-full bg-secondary/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary">
            {category}
          </span>
        ) : null}
        <CardTitle className="text-xl font-semibold text-dark dark:text-[var(--text)]">{name}</CardTitle>
        {brand ? <p className="text-xs uppercase tracking-[0.3em] text-muted">{brand}</p> : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted">
        {image ? (
          <div className="overflow-hidden rounded-2xl border border-accent/60 bg-white/80 p-4 text-center dark:border-accent-d/40 dark:bg-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote asset */}
            <img
              src={image}
              alt={name}
              className="mx-auto h-36 w-full max-w-[220px] object-contain"
              loading="lazy"
            />
          </div>
        ) : null}
        {description ? <p className="leading-relaxed text-muted">{description}</p> : null}
        {highlightList.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted/80">Points forts</p>
            <ul className="flex flex-wrap gap-2">
              {highlightList.map((item) => (
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
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-dark dark:text-[var(--text)]">{priceLabel}</span>
          {bestVendor ? <span className="text-xs text-muted">chez {bestVendor}</span> : null}
          {typeof rating === "number" && Number.isFinite(rating) ? (
            <span className="text-xs text-muted">
              {rating.toFixed(1)} ★
              {typeof reviewsCount === "number" && Number.isFinite(reviewsCount)
                ? ` · ${reviewsCount} avis`
                : ""}
            </span>
          ) : null}
        </div>
        {link ? (
          <Link
            href={link}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
          >
            Voir la fiche
          </Link>
        ) : null}
      </CardFooter>
    </Card>
  );
}
