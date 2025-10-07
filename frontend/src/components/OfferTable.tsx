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
    return { icon: "✅", label: "En stock" };
  }

  if (offer.inStock === false) {
    return { icon: "❌", label: offer.stockStatus ?? "Rupture" };
  }

  return { icon: "ℹ️", label: offer.stockStatus ?? "Indisponible" };
}

export function OfferTable({ offers, caption }: OfferTableProps) {
  if (offers.length === 0) {
    return <p className="text-sm text-gray-300">Aucune offre disponible pour le moment.</p>;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-inner">
      {caption && (
        <div className="border-b border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white">
          {caption}
        </div>
      )}

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-200">
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-300">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Vendeur
                </th>
                <th scope="col" className="px-4 py-3">
                  Prix
                </th>
                <th scope="col" className="px-4 py-3">
                  Livraison
                </th>
                <th scope="col" className="px-4 py-3">
                  Total
                </th>
                <th scope="col" className="px-4 py-3">
                  Stock
                </th>
                <th scope="col" className="px-4 py-3">
                  Source
                </th>
                <th scope="col" className="px-4 py-3">
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
                    className={`border-t border-white/10 transition hover:bg-white/5 ${
                      highlight ? "bg-emerald-500/10" : "bg-transparent"
                    }`}
                  >
                    <th scope="row" className="px-4 py-3 font-medium text-white">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2">
                          {offer.vendor}
                          {highlight && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                              Meilleur prix
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{offer.title}</span>
                      </div>
                    </th>
                    <td className="px-4 py-3 text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">{formatPrice(offer.price)}</span>
                        {typeof offer.pricePerKg === "number" && (
                          <span className="text-xs text-gray-400">{offer.pricePerKg.toFixed(2)} €/kg</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{formatShipping(offer)}</td>
                    <td className="px-4 py-3 text-white">
                      <span className="font-semibold">
                        {formatPrice(offer.totalPrice ?? offer.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {(() => {
                        const availability = getAvailability(offer);
                        return (
                          <span className="inline-flex items-center gap-2" aria-label={availability.label}>
                            <span aria-hidden>{availability.icon}</span>
                            <span className="text-xs text-gray-300">{availability.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{offer.source}</td>
                    <td className="px-4 py-3">
                      {offer.link ? (
                        <a
                          href={offer.link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600"
                        >
                          Consulter →
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">Lien indisponible</span>
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
              className={`rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-sm transition ${
                highlight
                  ? "border-emerald-400/60 bg-emerald-500/10"
                  : "hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 text-base font-semibold text-white">
                    {offer.vendor}
                    {highlight && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                        Meilleur prix
                      </span>
                    )}
                  </p>
                  {offer.title && <p className="mt-1 text-xs text-gray-400">{offer.title}</p>}
                </div>
                {offer.source && <span className="text-xs text-gray-400">{offer.source}</span>}
              </header>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-200">
                <div className="flex items-center justify-between gap-6">
                  <dt className="text-gray-400">Prix</dt>
                  <dd className="text-right">
                    <p className="font-semibold text-white">{formatPrice(offer.price)}</p>
                    {typeof offer.pricePerKg === "number" && (
                      <p className="text-xs text-gray-400">{offer.pricePerKg.toFixed(2)} €/kg</p>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <dt className="text-gray-400">Livraison</dt>
                  <dd className="font-medium text-white">{formatShipping(offer)}</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <dt className="text-gray-400">Total</dt>
                  <dd className="font-semibold text-white">{formatPrice(offer.totalPrice ?? offer.price)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-200">
                <span className="inline-flex items-center gap-2" aria-label={availability.label}>
                  <span aria-hidden>{availability.icon}</span>
                  <span className="text-xs text-gray-300">{availability.label}</span>
                </span>
                {offer.link ? (
                  <a
                    href={offer.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600"
                  >
                    Consulter →
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">Lien indisponible</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
