import type { DealItem } from "@/types/api";

interface OfferTableProps {
  offers: DealItem[];
  caption?: string;
}

const fallbackFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatPrice(price: DealItem["price"]) {
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

export function OfferTable({ offers, caption }: OfferTableProps) {
  if (offers.length === 0) {
    return <p className="text-sm text-gray-300">Aucune offre disponible pour le moment.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-left text-sm text-gray-200">
        {caption && (
          <caption className="bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white">
            {caption}
          </caption>
        )}
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-gray-300">
          <tr>
            <th className="px-4 py-3">Vendeur</th>
            <th className="px-4 py-3">Prix</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr
              key={offer.id}
              className={`border-t border-white/10 transition hover:bg-white/5 ${
                offer.bestPrice ? "bg-emerald-500/10" : "bg-transparent"
              }`}
            >
              <td className="px-4 py-3 font-medium text-white">
                <div className="flex flex-col">
                  <span>{offer.vendor}</span>
                  <span className="text-xs text-gray-400">{offer.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-white">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatPrice(offer.price)}</span>
                  {typeof offer.pricePerKg === "number" && (
                    <span className="text-xs text-gray-400">{offer.pricePerKg.toFixed(2)} €/kg</span>
                  )}
                </div>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
