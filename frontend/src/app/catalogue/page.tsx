"use client";

import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { WhyChooseUsSection } from "@/components/WhyChooseUsSection";
import { PriceAlertsSection } from "@/components/PriceAlertsSection";

type GoogleSheetCell = {
  v?: string | number | null;
};

interface GoogleSheetRow {
  c: Array<GoogleSheetCell | null>;
}

interface GoogleSheetColumn {
  label?: string | null;
}

interface GoogleSheetResponse {
  table: {
    cols: GoogleSheetColumn[];
    rows: GoogleSheetRow[];
  };
}

interface CatalogueEntry {
  title: string;
  count?: number;
  description?: string;
  image?: string;
  link?: string;
}

function extractEntries(rows: string[][]): CatalogueEntry[] {
  return rows
    .map((row) => {
      const [title, countValue, description, image, link] = row;
      const parsedCount = countValue ? Number.parseInt(countValue, 10) : undefined;

      return {
        title: title || "Catégorie",
        count: Number.isFinite(parsedCount) ? parsedCount : undefined,
        description: description && description.length > 0 ? description : undefined,
        image: image && image.startsWith("http") ? image : undefined,
        link: link && link.startsWith("http") ? link : undefined,
      };
    })
    .filter((entry) => entry.title.trim().length > 0);
}

export default function Catalogue() {
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const res = await fetch(
          "https://docs.google.com/spreadsheets/d/1XeD-sg3cT9WjWQ8O0mabRb1pNeIAY9sOhRUl-jnLND0/gviz/tq?tqx=out:json",
        );
        const text = await res.text();

        const json = JSON.parse(text.substring(47, text.length - 2)) as GoogleSheetResponse;
        const data = json.table.rows.map((row) =>
          row.c.map((cell) => {
            const value = cell?.v;
            if (typeof value === "number") {
              return value.toString();
            }
            return value ? String(value) : "";
          }),
        );

        setRows(data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le catalogue");
      } finally {
        setLoading(false);
      }
    };

    fetchSheet();
  }, []);

  const entries = useMemo(() => extractEntries(rows), [rows]);

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-orange-50/80 py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Catalogue thématique</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600">
            Parcourez les catégories les plus populaires de notre base de compléments. Chaque carte consolide les produits,
            les guides et les marchands les plus pertinents pour préparer votre prochaine comparaison.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                aria-hidden
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {entries.map((entry) => (
              <Card
                key={`${entry.title}-${entry.count ?? ""}`}
                className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-orange-50">
                    {entry.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote spreadsheet assets
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🏋️‍♂️</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900">{entry.title}</h2>
                    {typeof entry.count === "number" && (
                      <p className="text-sm text-orange-500">{entry.count.toLocaleString("fr-FR")} références suivies</p>
                    )}
                  </div>
                </div>
                {entry.description && (
                  <p className="text-sm text-slate-600">{entry.description}</p>
                )}
                <div className="mt-auto">
                  {entry.link ? (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-500"
                    >
                      Explorer la catégorie →
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-500">
                      Bientôt disponible
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <WhyChooseUsSection />
      <PriceAlertsSection catalogueHref="/products" />
    </div>
  );
}
