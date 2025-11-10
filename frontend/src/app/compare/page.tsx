import Image from "next/image";
import Link from "next/link";

const CTA_BUTTON_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6600] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#e65a00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6600]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]";
const CARD_BASE_CLASSES =
  "rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-sm";

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

interface NormalizedProduct {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image: string | null;
  rating: number | null;
  reviewsCount: number | null;
}

interface NormalizedOffer {
  id: string;
  vendor: string;
  priceAmount: number | null;
  priceText: string;
  totalText: string | null;
  link: string | null;
  rating: number | null;
  reviewsCount: number | null;
  shippingText: string | null;
  bestPrice: boolean;
}

function safeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
    if (!cleaned) {
      return null;
    }
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatPrice(amount: number | null, currency: string | null): string | null {
  if (amount === null || Number.isNaN(amount)) {
    return null;
  }
  if (!currency || currency === "EUR") {
    return priceFormatter.format(amount);
  }
  return `${priceFormatter.format(amount)} ${currency}`;
}

function resolvePrice(value: unknown): { amount: number | null; formatted: string | null; currency: string | null } {
  if (!value && value !== 0) {
    return { amount: null, formatted: null, currency: null };
  }
  if (typeof value === "number" || typeof value === "string") {
    const amount = safeNumber(value);
    return {
      amount,
      formatted: formatPrice(amount, "EUR"),
      currency: "EUR",
    };
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const amount = safeNumber(record.amount);
    const currency = safeString(record.currency);
    const formatted = safeString(record.formatted) ?? formatPrice(amount, currency ?? "EUR");
    return {
      amount,
      formatted,
      currency: currency ?? "EUR",
    };
  }
  return { amount: null, formatted: null, currency: null };
}

function extractProductFromEntry(entry: Record<string, unknown> | null, fallbackId: string): NormalizedProduct | null {
  if (!entry) {
    return null;
  }
  const images = Array.isArray(entry.images)
    ? entry.images.find((item): item is string => typeof item === "string" && item.trim().length > 0)
    : null;
  const gallery = Array.isArray(entry.gallery)
    ? entry.gallery.find((item): item is string => typeof item === "string" && item.trim().length > 0)
    : null;

  const id = safeString(entry.id)
    || safeString(entry.product_id)
    || safeString(entry.productId)
    || fallbackId;
  const name = safeString(entry.name) || safeString(entry.title) || "Produit";
  const brand = safeString(entry.brand) || safeString(entry.vendorBrand) || safeString(entry.marque);
  const description =
    safeString(entry.description)
    || safeString(entry.subtitle)
    || safeString(entry.resume)
    || safeString(entry.summary)
    || null;
  const image =
    safeString(entry.image)
    || safeString(entry.image_url)
    || safeString(entry.imageUrl)
    || gallery
    || images;
  const rating = safeNumber(entry.rating) ?? safeNumber(entry.averageRating) ?? safeNumber(entry.note);
  const reviewsCount = safeNumber(entry.reviewsCount) ?? safeNumber(entry.nb_reviews) ?? safeNumber(entry.reviews);

  return {
    id,
    name,
    brand,
    description,
    image,
    rating,
    reviewsCount,
  };
}

function normalizeOffer(record: Record<string, unknown>, index: number, fallbackVendor: string): NormalizedOffer | null {
  const vendor = safeString(record.vendor) || safeString(record.source) || fallbackVendor;
  const offerId =
    safeString(record.id)
    || safeString((record as Record<string, unknown>)["offer_id"])
    || safeString((record as Record<string, unknown>)["offerId"]);
  const relatedProductId =
    safeString((record as Record<string, unknown>)["productId"])
    || safeString((record as Record<string, unknown>)["product_id"]);
  const id = offerId || (relatedProductId ? `${vendor ?? fallbackVendor}-${relatedProductId}` : null) || `${fallbackVendor}-${index}`;
  const price = resolvePrice(record.price ?? record.totalPrice ?? record.bestPrice ?? record.amount);
  const total = resolvePrice(record.totalPrice);
  const rating = safeNumber(record.rating) ?? safeNumber(record.note) ?? safeNumber(record.averageRating);
  const reviewsCount = safeNumber(record.reviewsCount) ?? safeNumber(record.review_count);
  const shippingCost = safeNumber(record.shippingCost) ?? safeNumber(record.shipping_cost);
  const shippingText =
    safeString(record.shippingText)
    || safeString(record.shipping_text)
    || (typeof shippingCost === "number"
      ? shippingCost === 0
        ? "Livraison offerte"
        : `Livraison ${formatPrice(shippingCost, price.currency) ?? priceFormatter.format(shippingCost)}`
      : null);
  const link = safeString(record.link) || safeString(record.url);
  const bestPrice = Boolean(record.bestPrice) || Boolean(record.isBestPrice);

  const priceText = price.formatted ?? "Prix indisponible";
  const totalText = total.formatted && total.formatted !== price.formatted ? total.formatted : null;

  return {
    id,
    vendor: vendor ?? "Marchand",
    priceAmount: price.amount,
    priceText,
    totalText,
    link,
    rating,
    reviewsCount,
    shippingText,
    bestPrice,
  };
}

function resolveBaseUrl() {
  const envBase =
    process.env.INTERNAL_PROXY_BASE_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || process.env.APP_URL
    || process.env.VERCEL_URL
    || null;
  if (envBase) {
    if (/^https?:\/\//i.test(envBase)) {
      return envBase.replace(/\/$/, "");
    }
    return `https://${envBase.replace(/\/$/, "")}`;
  }
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

async function loadComparison(productId: string) {
  const baseUrl = resolveBaseUrl();
  const url = new URL("/api/proxy", baseUrl);
  url.searchParams.set("target", "compare");
  url.searchParams.set("id", productId);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractComparisonPayload(payload: unknown, productId: string): {
  product: NormalizedProduct | null;
  offers: NormalizedOffer[];
} {
  if (!payload || typeof payload !== "object") {
    return { product: null, offers: [] };
  }

  const record = payload as Record<string, unknown>;
  const directProduct = extractProductFromEntry(
    (record.product as Record<string, unknown> | undefined) ?? null,
    productId,
  );
  const directOffers = Array.isArray(record.offers) ? record.offers : [];

  if (directProduct && directOffers.length > 0) {
    const offers = directOffers
      .map((item, index) => normalizeOffer(item as Record<string, unknown>, index, directProduct.brand ?? "Marchand"))
      .filter((offer): offer is NormalizedOffer => Boolean(offer));
    return { product: directProduct, offers };
  }

  const products = Array.isArray(record.products) ? record.products : [];
  if (products.length > 0) {
    const normalizedEntries = products
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const item = entry as Record<string, unknown>;
        const product = extractProductFromEntry(
          (item.product as Record<string, unknown> | undefined) ?? null,
          productId,
        );
        const offers = Array.isArray(item.offers)
          ? item.offers
              .map((offer, index) =>
                normalizeOffer(offer as Record<string, unknown>, index, product?.brand ?? "Marchand"),
              )
              .filter((offer): offer is NormalizedOffer => Boolean(offer))
          : [];
        return { product, offers };
      })
      .filter((entry): entry is { product: NormalizedProduct | null; offers: NormalizedOffer[] } => Boolean(entry));

    const matching = normalizedEntries.find((entry) => {
      const candidateId = entry.product?.id?.toLowerCase();
      return candidateId ? candidateId === productId.toLowerCase() : false;
    });

    if (matching) {
      return { product: matching.product, offers: matching.offers };
    }

    if (normalizedEntries.length > 0) {
      return normalizedEntries[0];
    }
  }

  const summaryOffers = Array.isArray(record.summary) ? record.summary : [];
  if (summaryOffers.length > 0) {
    const offers = summaryOffers
      .map((item, index) => normalizeOffer(item as Record<string, unknown>, index, "Marchand"))
      .filter((offer): offer is NormalizedOffer => Boolean(offer));
    return { product: directProduct, offers };
  }

  return { product: directProduct, offers: [] };
}

function sortOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  return [...offers].sort((a, b) => {
    const priceA = a.priceAmount ?? Number.POSITIVE_INFINITY;
    const priceB = b.priceAmount ?? Number.POSITIVE_INFINITY;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    if (a.bestPrice && !b.bestPrice) {
      return -1;
    }
    if (!a.bestPrice && b.bestPrice) {
      return 1;
    }
    return a.vendor.localeCompare(b.vendor, "fr", { sensitivity: "base" });
  });
}

function renderRating(rating: number | null, reviewsCount: number | null) {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {rating.toFixed(1)} ★
      {typeof reviewsCount === "number" && Number.isFinite(reviewsCount) ? (
        <span className="text-[11px] text-[color:var(--muted)]">
          ({reviewsCount.toLocaleString("fr-FR")} avis)
        </span>
      ) : null}
    </span>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  const rawId = searchParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || !id.trim()) {
    return (
      <main className="min-h-screen bg-[color:var(--accent)] pb-20 pt-16 text-[color:var(--text)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className={`${CARD_BASE_CLASSES} p-8 text-center`}>Identifiant produit manquant.</div>
        </div>
      </main>
    );
  }

  const payload = await loadComparison(id);
  const { product, offers } = extractComparisonPayload(payload, id);
  const sortedOffers = sortOffers(offers);

  return (
    <main className="min-h-screen bg-[color:var(--accent)] pb-24 pt-16 text-[color:var(--text)]">
      <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
        <header className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#FF6600]">Comparateur</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{product?.name ?? "Comparaison FitIdion"}</h1>
          <p className="mx-auto max-w-2xl text-sm text-[color:var(--muted)]">
            Analysez instantanément les offres de nos partenaires et de Google Shopping. Les meilleurs prix sont mis en avant en
            priorité pour faciliter votre décision.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div className={`${CARD_BASE_CLASSES} overflow-hidden`}>
            <div className="relative h-72 w-full bg-[color:var(--secondary)]">
              {product?.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                  loading="lazy"
                />
              ) : (
                <Image
                  src="/placeholder.png"
                  alt="Image produit"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                  loading="lazy"
                />
              )}
            </div>
            <div className="space-y-3 p-6">
              <div className="space-y-1">
                {product?.brand ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF6600]">{product.brand}</p>
                ) : null}
                <h2 className="text-xl font-semibold text-[color:var(--text)]">{product?.name ?? "Produit"}</h2>
              </div>
              {product?.description ? (
                <p className="text-sm text-[color:var(--muted)]">{product.description}</p>
              ) : null}
              {renderRating(product?.rating ?? null, product?.reviewsCount ?? null)}
            </div>
          </div>

          <div className={`${CARD_BASE_CLASSES} p-6`}>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">Offres disponibles</h2>
            <p className="text-sm text-[color:var(--muted)]">
              Classement des marchands par prix TTC. Les frais de livraison sont indiqués lorsque disponibles.
            </p>

            {sortedOffers.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--surface-strong)]/60 p-6 text-center text-sm text-[color:var(--muted)]">
                Aucune offre disponible pour ce produit.
              </p>
            ) : (
              <div className="mt-6 overflow-hidden rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[color:var(--secondary)]/60 text-xs uppercase tracking-wide text-[color:var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Vendeur</th>
                      <th className="px-4 py-3 text-left">Prix</th>
                      <th className="px-4 py-3 text-left">Livraison</th>
                      <th className="px-4 py-3 text-left">Note</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOffers.map((offer, index) => (
                      <tr
                        key={offer.id}
                        className={`border-t border-[color:var(--border-soft)]/80 transition-colors ${
                          index === 0 || offer.bestPrice
                            ? "bg-[#FFF5EB]/70 dark:bg-[color:var(--secondary)]/40"
                            : "bg-[color:var(--surface)]"
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-[color:var(--text)]">{offer.vendor}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col text-[color:var(--text)]">
                            <span className="text-base font-semibold">{offer.priceText}</span>
                            {offer.totalText ? (
                              <span className="text-xs text-[color:var(--muted)]">Total : {offer.totalText}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-[color:var(--muted)]">{offer.shippingText ?? "À vérifier"}</td>
                        <td className="px-4 py-4 text-sm text-[color:var(--muted)]">
                          {offer.rating !== null ? `${offer.rating.toFixed(1)} ★` : "—"}
                          {typeof offer.reviewsCount === "number" && Number.isFinite(offer.reviewsCount) ? (
                            <span className="ml-1 text-xs">({offer.reviewsCount.toLocaleString("fr-FR")})</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {offer.link ? (
                            <Link
                              href={offer.link}
                              className={CTA_BUTTON_CLASSES}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Voir l&apos;offre
                            </Link>
                          ) : (
                            <span className="text-xs text-[color:var(--muted)]">Lien indisponible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
