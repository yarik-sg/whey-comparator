"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  ClipboardList,
  LineChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { GymCard } from "@/components/GymCard";
import { ProductCard } from "@/components/ProductCard";
import { ProgramCard, type Programme } from "@/components/programs/ProgramCard";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import programmesData from "@/data/programmes.json";
import apiClient from "@/lib/apiClient";
import { resolveProductIdentifier } from "@/lib/productIdentifiers";
import { cn } from "@/lib/utils";
import {
  selectFavoriteGyms,
  selectFavoriteProducts,
  useFavoritesStore,
} from "@/store/favoritesStore";
import type { PriceHistoryPoint, PriceHistoryResponse, ProductSummary } from "@/types/api";

const programmes = programmesData as Programme[];

interface PriceHistoryItem {
  id: string;
  product: ProductSummary;
  history: PriceHistoryPoint[];
  latestPrice: number | null;
  previousPrice: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdate: string | null;
  currency: string;
}

function formatCurrency(value: number | null, currency: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Non renseigné";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export default function DashboardPageClient() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const productFavorites = selectFavoriteProducts(favorites);
  const gymFavorites = selectFavoriteGyms(favorites);

  const [priceHistoryItems, setPriceHistoryItems] = useState<PriceHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const trackedProducts = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ id: string; product: ProductSummary }> = [];

    for (const favorite of productFavorites) {
      const identifier = resolveProductIdentifier(
        favorite.product.product_id,
        favorite.product.bestDeal?.productId,
        favorite.product.id,
      );

      if (!identifier || seen.has(identifier)) {
        continue;
      }

      seen.add(identifier);
      result.push({ id: identifier, product: favorite.product });

      if (result.length >= 5) {
        break;
      }
    }

    return result;
  }, [productFavorites]);

  useEffect(() => {
    if (trackedProducts.length === 0) {
      setPriceHistoryItems([]);
      setHistoryError(null);
      setIsHistoryLoading(false);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    setIsHistoryLoading(true);
    setHistoryError(null);

    const loadHistory = async () => {
      try {
        const items = await Promise.all(
          trackedProducts.map(async ({ id, product }) => {
            try {
              const encodedId = encodeURIComponent(id);
              const response = await apiClient.get<PriceHistoryResponse>(
                `/api/prices/history/${encodedId}`,
                {
                  cache: "no-store",
                  signal: abortController.signal,
                },
              );

              const historyEntries = (response?.history ?? []).filter(
                (entry): entry is PriceHistoryPoint =>
                  typeof entry?.price === "number" && Number.isFinite(entry.price),
              );

              if (historyEntries.length === 0) {
                return null;
              }

              const sortedHistory = [...historyEntries].sort(
                (a, b) => Date.parse(a.date) - Date.parse(b.date),
              );

              const latestEntry = sortedHistory.at(-1) ?? null;
              const previousEntry = sortedHistory.length > 1 ? sortedHistory.at(-2) ?? null : null;

              const latestPrice = latestEntry?.price ?? null;
              const previousPrice = previousEntry?.price ?? null;
              const change =
                typeof latestPrice === "number" && typeof previousPrice === "number"
                  ? latestPrice - previousPrice
                  : null;

              const changePercent =
                change !== null && typeof previousPrice === "number" && previousPrice !== 0
                  ? (change / previousPrice) * 100
                  : null;

              return {
                id,
                product,
                history: sortedHistory,
                latestPrice: typeof latestPrice === "number" ? latestPrice : null,
                previousPrice: typeof previousPrice === "number" ? previousPrice : null,
                change: typeof change === "number" && Number.isFinite(change) ? change : null,
                changePercent:
                  typeof changePercent === "number" && Number.isFinite(changePercent)
                    ? changePercent
                    : null,
                lastUpdate: latestEntry?.date ?? null,
                currency: latestEntry?.currency ?? product.bestPrice.currency ?? "EUR",
              } satisfies PriceHistoryItem;
            } catch (error) {
              if ((error as DOMException)?.name === "AbortError") {
                return null;
              }

              console.error("Failed to fetch price history", error);
              return null;
            }
          }),
        );

        if (!isMounted) {
          return;
        }

        const filtered = items.filter(
          (item): item is PriceHistoryItem => item !== null && typeof item === "object",
        );
        setPriceHistoryItems(filtered);
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          return;
        }

        console.error("Unable to load price history", error);
        if (isMounted) {
          setHistoryError("Impossible de charger l'historique des prix pour le moment.");
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [trackedProducts]);

  const hasFavorites = favorites.length > 0;
  const hasProductFavorites = productFavorites.length > 0;
  const hasGymFavorites = gymFavorites.length > 0;

  return (
    <div className="bg-gradient-to-b from-background via-background to-accent/40 py-12 text-dark dark:from-dark dark:via-dark d
ark:to-[rgba(15,23,42,0.75)] dark:text-[var(--text)]">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 pb-12">
          <div className="inline-flex max-w-max items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold up
percase tracking-[0.35em] text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            Espace FitIdion
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold sm:text-4xl">Votre tableau de bord personnel</h1>
            <p className="max-w-3xl text-base text-muted">
              Retrouvez vos favoris, surveillez l&apos;évolution des prix et continuez vos programmes FitIdion depuis un
              seul espace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
              {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
              {priceHistoryItems.length} suivi prix
            </Badge>
            <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
              {programmes.length} programme{programmes.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </header>

        <Tabs defaultValue="favorites" className="space-y-12">
          <TabsList className="flex flex-col gap-2 rounded-3xl bg-accent/60 p-2 sm:flex-row">
            <TabsTrigger value="favorites" className="flex-1">
              <span className="flex items-center justify-center gap-2">
                <BookmarkCheck className="h-4 w-4" aria-hidden />
                Favoris
              </span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <span className="flex items-center justify-center gap-2">
                <LineChart className="h-4 w-4" aria-hidden />
                Historique de prix
              </span>
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex-1">
              <span className="flex items-center justify-center gap-2">
                <ClipboardList className="h-4 w-4" aria-hidden />
                Programmes
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-8">
            {!hasFavorites ? (
              <Card className="border-accent/60 bg-background/95 p-10 text-center text-muted shadow-sm dark:border-accent-d/40 d
ark:bg-dark/80">
                <CardHeader className="space-y-3">
                  <CardTitle className="flex flex-col items-center gap-3 text-2xl font-semibold text-dark dark:text-[var(--text)"]">
                    <BookmarkCheck className="h-8 w-8 text-primary" aria-hidden />
                    Aucun favori enregistré
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <p>Ajoutez des produits ou des salles pour les retrouver facilement ici.</p>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/products"
                      className={buttonClassName({ className: "w-full gap-2 sm:w-auto", size: "sm" })}
                    >
                      Explorer les produits
                    </Link>
                    <Link
                      href="/gyms"
                      className={buttonClassName({
                        variant: "secondary",
                        size: "sm",
                        className: "w-full gap-2 sm:w-auto",
                      })}
                    >
                      Trouver une salle
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-10">
                {hasProductFavorites ? (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BookmarkCheck className="h-5 w-5 text-primary" aria-hidden />
                        <h2 className="text-2xl font-semibold text-dark dark:text-[var(--text)]">
                          Produits favoris
                        </h2>
                      </div>
                      <Link
                        href="/favoris"
                        className={cn(
                          "text-sm font-semibold text-primary transition hover:text-primary/80",
                        )}
                      >
                        Gérer mes favoris
                      </Link>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {productFavorites.map((favorite) => (
                        <ProductCard key={`favorite-product-${favorite.id}`} product={favorite.product} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {hasGymFavorites ? (
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <BookmarkCheck className="h-5 w-5 text-primary" aria-hidden />
                        <h2 className="text-2xl font-semibold text-dark dark:text-[var(--text)]">
                          Salles favorites
                        </h2>
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {gymFavorites.map((favorite) => (
                        <GymCard
                          key={`favorite-gym-${favorite.id}`}
                          gym={favorite.gym}
                          href={favorite.gym.link ?? favorite.gym.website ?? null}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-8">
            {historyError ? (
              <Card className="border-primary/30 bg-primary/5 p-6 text-primary shadow-sm">
                <p className="text-sm">{historyError}</p>
              </Card>
            ) : null}

            {isHistoryLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: Math.max(trackedProducts.length, 2) }).map((_, index) => (
                  <Card key={`history-skeleton-${index}`} className="animate-pulse border-accent/60 bg-background/80 p-6">
                    <div className="h-4 w-2/3 rounded-full bg-accent/70" />
                    <div className="mt-6 h-3 w-full rounded-full bg-accent/60" />
                    <div className="mt-3 h-3 w-5/6 rounded-full bg-accent/60" />
                    <div className="mt-3 h-3 w-3/4 rounded-full bg-accent/60" />
                  </Card>
                ))}
              </div>
            ) : priceHistoryItems.length === 0 ? (
              <Card className="border-accent/60 bg-background/95 p-10 text-center text-muted shadow-sm dark:border-accent-d/40 d
ark:bg-dark/80">
                <CardHeader className="space-y-3">
                  <CardTitle className="flex flex-col items-center gap-3 text-2xl font-semibold text-dark dark:text-[var(--text)"]">
                    <LineChart className="h-8 w-8 text-primary" aria-hidden />
                    Aucun suivi de prix pour le moment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-sm">
                  <p>
                    Consultez un produit et ajoutez-le à vos favoris pour suivre son évolution tarifaire automatiquement.
                  </p>
                  <Link href="/products" className={buttonClassName({ size: "sm", className: "gap-2" })}>
                    Chercher des produits
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {priceHistoryItems.map((item) => {
                  const hasVariation =
                    item.change !== null &&
                    item.previousPrice !== null &&
                    Math.abs(item.change) > 0.009;
                  const trendIcon =
                    !hasVariation || item.change === null
                      ? null
                      : item.change > 0
                      ? <TrendingUp className="h-4 w-4" aria-hidden />
                      : <TrendingDown className="h-4 w-4" aria-hidden />;
                  const formattedChange =
                    hasVariation && item.change !== null
                      ? `${item.change > 0 ? "+" : "-"}${formatCurrency(Math.abs(item.change), item.currency)}`
                      : null;

                  return (
                    <Card
                      key={`price-history-${item.id}`}
                      className="flex h-full flex-col justify-between border-accent/60 bg-background/95 shadow-sm transition hover:b
order-primary/40 hover:shadow-lg dark:border-accent-d/40 dark:bg-dark/80"
                    >
                      <CardHeader className="space-y-3">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-dark dark:text-[var(--text)]">
                            {item.product.name}
                          </h3>
                          {item.product.brand ? (
                            <p className="text-sm text-muted">{item.product.brand}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold text-dark dark:text-[var(--text)]">
                            {formatCurrency(item.latestPrice, item.currency)}
                          </span>
                          {hasVariation ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                                item.change !== null && item.change > 0
                                  ? "bg-red-100 text-red-600"
                                  : "bg-green-100 text-green-600",
                              )}
                            >
                              {trendIcon}
                              {formattedChange}
                              {item.changePercent !== null
                                ? ` (${item.changePercent > 0 ? "+" : ""}${item.changePercent.toFixed(1)}%)`
                                : ""}
                            </span>
                          ) : (
                            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-muted">
                              Variation stable
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          Dernière mise à jour : {formatDateLabel(item.lastUpdate)}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-muted">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-[0.3em] text-muted">Historique récent</p>
                          <ul className="space-y-2">
                            {item.history
                              .slice(-3)
                              .reverse()
                              .map((entry) => (
                                <li key={`${item.id}-${entry.date}`} className="flex justify-between">
                                  <span>{formatDateLabel(entry.date)}</span>
                                  <span className="font-semibold text-dark dark:text-[var(--text)]">
                                    {formatCurrency(entry.price, entry.currency ?? item.currency)}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>Prix précédent</span>
                          <span className="font-semibold text-dark dark:text-[var(--text)]">
                            {formatCurrency(item.previousPrice, item.currency)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="programs" className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-dark dark:text-[var(--text)]">
                  Vos programmes FitIdion
                </h2>
                <p className="text-sm text-muted">
                  Continuez les programmes que vous avez consultés ou enregistrez une nouvelle routine adaptée à vos objectifs.
                </p>
              </div>
              <Link
                href="/programmes"
                className={buttonClassName({ variant: "outline", size: "sm", className: "gap-2" })}
              >
                Explorer tous les programmes
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {programmes.map((programme) => (
                <ProgramCard key={programme.id} programme={programme} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
