import type { ApiPrice, DealItem } from "@/types/api";

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

export function OfferTable({ offers, caption }: OfferTableProps) {
  if (offers.length === 0) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Aucune offre disponible pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {caption && (
        <div className="border-b border-slate-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-600">
          {caption}
        </div>
      )}

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                    className={`border-t border-slate-200 transition ${
                      highlight ? "bg-orange-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <th scope="row" className="px-4 py-4 font-semibold text-slate-900">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          {offer.vendor}
                          {highlight && (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                              Meilleur prix
                            </span>
                          )}
                        </span>
                        {offer.title && <span className="text-xs text-slate-400">{offer.title}</span>}
                      </div>
                    </th>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{formatPrice(offer.price)}</span>
                        {typeof offer.pricePerKg === "number" && (
                          <span className="text-xs text-slate-400">{offer.pricePerKg.toFixed(2)} €/kg</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatShipping(offer)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {formatPrice(offer.totalPrice ?? offer.price)}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {(() => {
                        const availability = getAvailability(offer);
                        return (
                          <span className="inline-flex items-center gap-2" aria-label={availability.label}>
                            <span aria-hidden>{availability.icon}</span>
                            <span className="text-xs text-slate-500">{availability.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-500">{offer.source}</td>
                    <td className="px-4 py-4">
                      {offer.link ? (
                        <a
                          href={offer.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-500"
                        >
                          Consulter →
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Lien indisponible</span>
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
                  ? "border-orange-200 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    {offer.vendor}
                    {highlight && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                        Meilleur prix
                      </span>
                    )}
                  </p>
                  {offer.title && <p className="mt-1 text-xs text-slate-400">{offer.title}</p>}
                </div>
                {offer.source && <span className="text-xs text-slate-400">{offer.source}</span>}
              </header>

              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Prix</dt>
                  <dd className="font-semibold text-slate-900">{formatPrice(offer.price)}</dd>
                </div>
                {typeof offer.pricePerKg === "number" && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">€/kg</dt>
                    <dd>{offer.pricePerKg.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Livraison</dt>
                  <dd>{formatShipping(offer)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total</dt>
                  <dd className="font-semibold text-slate-900">{formatPrice(offer.totalPrice ?? offer.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Disponibilité</dt>
                  <dd className="inline-flex items-center gap-2 text-slate-600" aria-label={availability.label}>
                    <span aria-hidden>{availability.icon}</span>
                    <span className="text-xs">{availability.label}</span>
                  </dd>
                </div>
              </dl>

              <footer className="mt-4">
                {offer.link ? (
                  <a
                    href={offer.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex w-full items-center justify-center rounded-full border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-500"
                  >
                    Consulter l&apos;offre →
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Lien indisponible</span>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}
