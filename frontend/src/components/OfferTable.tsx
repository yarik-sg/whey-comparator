import type { ApiPrice, DealItem } from "@/types/api";
import { AnalyticsLink } from "@/components/AnalyticsLink";

interface OfferTableProps {
  offers: DealItem[];
  caption?: string;
}

const fallbackFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatPrice(price: ApiPrice | null | undefined) {
  if (price?.formatted) {
    return price.formatted;
  }

  if (typeof price?.amount === "number") {
    const currency = price.currency ?? "EUR";
    const formatted = fallbackFormatter.format(price.amount);
    return currency === "EUR" ? formatted : `${formatted} ${currency}`;
  }

  return "N/A";
}

function formatShipping(offer: DealItem) {
  if (typeof offer.shippingCost === "number") {
    if (offer.shippingCost === 0) {
      return "Offert";
    }
    const currency = offer.price.currency ?? offer.totalPrice?.currency ?? "EUR";
    return formatPrice({
      amount: offer.shippingCost,
      currency,
      formatted: offer.shippingText ?? null,
    });
  }

  if (offer.shippingText) {
    return offer.shippingText;
  }

  return "—";
}

function getAvailability(offer: DealItem) {
  if (offer.inStock === true) {
    return { icon: "🟢", label: "En stock" };
  }

  if (offer.inStock === false) {
    return { icon: "🔴", label: offer.stockStatus ?? "Rupture" };
  }

  return { icon: "⚪", label: offer.stockStatus ?? "Indisponible" };
}

function renderRating(offer: DealItem) {
  if (typeof offer.rating === "number") {
    const rating = offer.rating.toFixed(1);
    const reviews =
      typeof offer.reviewsCount === "number"
        ? `${offer.reviewsCount.toLocaleString("fr-FR")} avis`
        : "Avis externes";

    return (
      <div className="flex flex-col text-xs text-muted">
        <span className="font-semibold text-dark">{rating} ★</span>
        <span>{reviews}</span>
      </div>
    );
  }

  return <span className="text-xs text-muted/80">—</span>;
}

export function OfferTable({ offers, caption }: OfferTableProps) {
  if (offers.length === 0) {
    return (
      <p className="rounded-3xl border border-accent/70 bg-accent p-6 text-sm text-muted">
        Aucune offre disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-accent/70 bg-background shadow-sm">
      {caption && (
        <div className="border-b border-accent/70 bg-accent px-4 py-3 text-sm font-semibold text-primary">
          {caption}
        </div>
      )}

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-muted">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-accent text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Vendeur
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Prix
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Livraison
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Total
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Stock
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Avis
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Source
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const highlight = offer.bestPrice || offer.isBestPrice;
                return (
                  <tr
                    key={offer.id}
                    className={`border-t border-accent/70 transition ${
                      highlight ? "bg-accent" : "hover:bg-accent"
                    }`}
                  >
                    <th scope="row" className="px-4 py-4 font-semibold text-dark">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          {offer.vendor}
                          {highlight && (
                            <span className="inline-flex items-center rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Meilleur prix
                            </span>
                          )}
                        </span>
                        {offer.title && <span className="text-xs text-muted/80">{offer.title}</span>}
                      </div>
                    </th>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-dark">{formatPrice(offer.price)}</span>
                        {typeof offer.pricePerKg === "number" && (
                          <span className="text-xs text-muted/80">{offer.pricePerKg.toFixed(2)} €/kg</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">{formatShipping(offer)}</td>
                    <td className="px-4 py-4 font-semibold text-dark">
                      {formatPrice(offer.totalPrice ?? offer.price)}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {(() => {
                        const availability = getAvailability(offer);
                        return (
                          <span className="inline-flex items-center gap-2" aria-label={availability.label}>
                            <span aria-hidden>{availability.icon}</span>
                            <span className="text-xs text-muted">{availability.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4">{renderRating(offer)}</td>
                    <td className="px-4 py-4 text-muted">{offer.source}</td>
                    <td className="px-4 py-4">
                      {offer.link ? (
                        <a
                          href={offer.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
                        >
                          Consulter →
                        </a>
                      ) : (
                        <span className="text-xs text-muted/80">Lien indisponible</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 md:hidden">
        {offers.map((offer) => {
          const highlight = offer.bestPrice || offer.isBestPrice;
          const availability = getAvailability(offer);
          return (
            <article
              key={offer.id}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                highlight
                  ? "border-primary/30 bg-accent"
                  : "border-accent/70 bg-background hover:border-primary/30"
              }`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-base font-semibold text-dark">
                    {offer.vendor}
                    {highlight && (
                      <span className="inline-flex items-center rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Meilleur prix
                      </span>
                    )}
                  </p>
                  {offer.title && <p className="mt-1 text-xs text-muted/80">{offer.title}</p>}
                </div>
                {offer.source && <span className="text-xs text-muted/80">{offer.source}</span>}
              </header>

              <dl className="mt-4 space-y-2 text-sm text-muted">
                <div className="flex justify-between">
                  <dt className="text-muted">Prix</dt>
                  <dd className="font-semibold text-dark">{formatPrice(offer.price)}</dd>
                </div>
                {typeof offer.pricePerKg === "number" && (
                  <div className="flex justify-between">
                    <dt className="text-muted">€/kg</dt>
                    <dd>{offer.pricePerKg.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Livraison</dt>
                  <dd>{formatShipping(offer)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Total</dt>
                  <dd className="font-semibold text-dark">{formatPrice(offer.totalPrice ?? offer.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Disponibilité</dt>
                  <dd className="inline-flex items-center gap-2 text-muted" aria-label={availability.label}>
                    <span aria-hidden>{availability.icon}</span>
                    <span className="text-xs">{availability.label}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Avis</dt>
                  <dd>{renderRating(offer)}</dd>
                </div>
              </dl>

              <footer className="mt-4">
                {offer.link ? (
                  <AnalyticsLink
                    href={offer.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex w-full items-center justify-center rounded-full border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary/40 hover:text-primary"
                    analyticsAction="buy"
                    analyticsLabel={`Consulter l'offre chez ${offer.vendor ?? "vendeur"}`}
                    analyticsMetadata={{
                      vendor: offer.vendor,
                      price: offer.price.formatted,
                      productId: offer.productId ?? offer.id,
                    }}
                  >
                    Consulter l&apos;offre →
                  </AnalyticsLink>
                ) : (
                  <span className="text-xs text-muted/80">Lien indisponible</span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
