"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Search, Store } from "lucide-react";

import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/apiClient";
import { buildDisplayImageUrl } from "@/lib/images";
import type { ApiPrice, DealItem } from "@/types/api";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatPriceValue(price?: ApiPrice | null) {
  if (!price) {
    return "Prix non disponible";
  }

  if (price.formatted) {
    return price.formatted;
  }

  if (typeof price.amount === "number") {
    const formatted = priceFormatter.format(price.amount);
    const currency = price.currency ?? "EUR";
    return currency === "EUR" ? formatted : `${formatted} ${currency}`;
  }

  return "Prix non disponible";
}

function formatShipping(offer: DealItem) {
  if (typeof offer.shippingCost === "number") {
    if (offer.shippingCost === 0) {
      return "Livraison offerte";
    }
    return `Livraison ${formatPriceValue({
      amount: offer.shippingCost,
      currency: offer.totalPrice?.currency ?? offer.price.currency,
      formatted: offer.shippingText ?? null,
    })}`;
  }

  if (offer.shippingText) {
    return offer.shippingText;
  }

  return "Livraison à vérifier";
}

export default function Comparateur() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "whey protein 2kg";

  const [produits, setProduits] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Recherche & filtres
  const [q, setQ] = useState(qParam);
  const [marque, setMarque] = useState("");
  const [categorie, setCategorie] = useState("");
  const [minPrix, setMinPrix] = useState("");
  const [maxPrix, setMaxPrix] = useState("");

  const fetchProduits = (searchValue?: string) => {
    const queryValue = searchValue ?? q;
    setLoading(true);
    setApiError(null);

    apiClient
      .get<DealItem[]>("/compare", {
        query: {
          q: queryValue,
          marque: marque || undefined,
          categorie: categorie || undefined,
          limit: 24,
        },
        cache: "no-store",
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProduits(data);
        } else {
          setApiError("Réponse inattendue du serveur");
          setProduits([]);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setApiError("Erreur API: " + message);
        setProduits([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setQ(qParam);
    fetchProduits(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchProduits();
  };

  const produitsFiltres = useMemo(() => {
    return produits.filter((p) => {
      const n = typeof p.price?.amount === "number" ? p.price.amount : undefined;
      const min = minPrix ? Number.parseFloat(minPrix) : undefined;
      const max = maxPrix ? Number.parseFloat(maxPrix) : undefined;

      if (min !== undefined && (n === undefined || n < min)) return false;
      if (max !== undefined && (n === undefined || n > max)) return false;
      return true;
    });
  }, [produits, maxPrix, minPrix]);

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-accent py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Comparateur en temps réel
              </p>
              <h1 className="text-3xl font-bold text-dark sm:text-4xl">
                Affinez votre recherche de compléments
              </h1>
              <p className="max-w-2xl text-base text-muted">
                Connecté à SerpAPI et à notre base interne, le comparateur détecte en quelques secondes les meilleures
                offres whey, BCAA, créatine et plus encore. Renseignez une référence précise pour analyser prix, frais de
                port et disponibilité.
              </p>
            </div>
            <Card className="w-full max-w-md border-secondary/60 bg-white/80 backdrop-blur">
              <form className="space-y-4" onSubmit={handleSearchSubmit}>
                <label htmlFor="search" className="text-sm font-medium text-muted">
                  Produit ou référence à comparer
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/60" />
                  <Input
                    id="search"
                    name="search"
                    type="search"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Ex. whey isolate chocolat 2kg"
                    className="pl-12"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  Lancer la recherche
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-10">
        <Card className="border-secondary/60">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-dark">Filtres rapides</h2>
            <p className="text-sm text-muted">
              Combinez marque, catégorie et budget pour épurer les offres affichées ci-dessous.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              value={marque}
              onChange={(event) => setMarque(event.target.value)}
              placeholder="Marque (ex. MyProtein)"
              aria-label="Filtrer par marque"
            />
            <Input
              value={categorie}
              onChange={(event) => setCategorie(event.target.value)}
              placeholder="Catégorie (ex. BCAA, créatine)"
              aria-label="Filtrer par catégorie"
            />
            <Input
              value={minPrix}
              onChange={(event) => setMinPrix(event.target.value)}
              placeholder="Prix min (€)"
              inputMode="decimal"
              aria-label="Prix minimum"
            />
            <Input
              value={maxPrix}
              onChange={(event) => setMaxPrix(event.target.value)}
              placeholder="Prix max (€)"
              inputMode="decimal"
              aria-label="Prix maximum"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 font-semibold text-primary">
              <Store className="h-4 w-4" />
              Sources multi-marchands vérifiées
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Statut de stock actualisé
            </div>
          </div>
        </Card>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-dark">Résultats</h2>
              <p className="text-sm text-muted">
                {loading
                  ? "Analyse des offres en cours…"
                  : `${produitsFiltres.length.toLocaleString("fr-FR")} produits correspondants`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => fetchProduits()} disabled={loading}>
              Rafraîchir les prix
            </Button>
          </div>

          {apiError && (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{apiError}</div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-3xl border border-secondary/60 bg-accent/70"
                  aria-hidden
                />
              ))}
            </div>
          ) : produitsFiltres.length === 0 ? (
            <div className="rounded-3xl border border-secondary/60 bg-accent p-8 text-center text-sm text-primary">
              Aucun résultat ne correspond aux filtres sélectionnés. Essayez d&apos;élargir votre recherche.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {produitsFiltres.map((p, index) => (
                  <motion.div
                    key={`${p.id}-${index}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="group flex h-full flex-col rounded-3xl border border-secondary/60 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="relative flex items-center justify-center rounded-2xl bg-accent p-6">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote images */}
                      <img
                        src={buildDisplayImageUrl(p.image) || "/placeholder.png"}
                        alt={p.title}
                        className="h-40 w-40 object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-primary">{p.vendor ?? "Marchand"}</p>
                        <h3 className="line-clamp-2 text-lg font-semibold text-dark">{p.title}</h3>
                      </div>
                      {(p.isBestPrice || p.bestPrice) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Meilleur prix détecté
                        </span>
                      )}
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-2xl font-bold text-dark">{formatPriceValue(p.price)}</span>
                        <span className="text-sm text-muted">Total : {formatPriceValue(p.totalPrice ?? p.price)}</span>
                      </div>
                      {typeof p.pricePerKg === "number" && (
                        <p className="text-sm text-muted">≈ {p.pricePerKg.toFixed(2)} €/kg</p>
                      )}
                      <p className="text-xs text-muted">{formatShipping(p)}</p>
                      <p className="flex items-center gap-2 text-xs text-muted">
                        <CheckCircle2
                          className={`h-4 w-4 ${p.inStock ? "text-emerald-500" : "text-muted/80"}`}
                          aria-hidden
                        />
                        <span>
                          {p.inStock === null || p.inStock === undefined
                            ? p.stockStatus ?? "Disponibilité à confirmer"
                            : p.stockStatus ?? (p.inStock ? "Disponible" : "Vérifier le stock")}
                        </span>
                      </p>
                      <span className="inline-flex items-center rounded-full bg-accent/70 px-3 py-1 text-xs font-medium text-muted">
                        {p.source}
                      </span>
                    </div>
                    <div className="mt-6 pt-4">
                      {p.link ? (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
                        >
                          Voir l&apos;offre
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      ) : (
                        <span className="inline-flex w-full items-center justify-center rounded-full bg-accent/70 px-4 py-2 text-sm font-medium text-muted/80">
                          Lien indisponible
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>
      </div>

      <WhyChooseUsSection />
      <PriceAlertsSection catalogueHref="/products" />
    </div>
  );
}
