"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";

interface SearchResults {
  products?: Array<Record<string, unknown>>;
  gyms?: Array<Record<string, unknown>>;
  programmes?: Array<Record<string, unknown>>;
  error?: boolean;
}

export default function SearchPage() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setIsError(false);
      return;
    }

    let isMounted = true;
    setIsError(false);
    setResults(null);

    const fetchResults = async () => {
      try {
        const compareResponse = await fetch(
          `/api/proxy?target=compare&q=${encodeURIComponent(query)}&limit=12`,
          { cache: "no-store" },
        );
        if (!compareResponse.ok) {
          throw new Error("Erreur réseau compare");
        }

        const comparePayload = await compareResponse.json();
        const products = Array.isArray(comparePayload) ? comparePayload : [];

        let supporting: SearchResults = {};
        try {
          const searchResponse = await fetch(`/api/proxy?target=search&q=${encodeURIComponent(query)}`, {
            cache: "no-store",
          });
          if (searchResponse.ok) {
            supporting = await searchResponse.json();
          }
        } catch (error) {
          console.warn("Failed to load supplementary search data", error);
        }

        if (!isMounted) {
          return;
        }

        setResults({
          products,
          gyms: Array.isArray(supporting.gyms) ? supporting.gyms : [],
          programmes: Array.isArray(supporting.programmes) ? supporting.programmes : [],
        });
      } catch (error) {
        console.error("Search request failed", error);
        if (!isMounted) {
          return;
        }
        setIsError(true);
        setResults({ error: true });
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (!query) {
    return <p className="mt-20 text-center">Entrez une recherche.</p>;
  }

  if (!results && !isError) {
    return <p className="mt-20 text-center">Chargement...</p>;
  }

  if (isError || results?.error) {
    return <p className="mt-20 text-center text-red-500">Impossible de charger les résultats.</p>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      {["products", "gyms", "programmes"].map((section) => {
        const items = (results?.[section as keyof SearchResults] as Array<Record<string, unknown>>) || [];
        if (!items || items.length === 0) {
          return null;
        }

        return (
          <section key={section}>
            <h2 className="mb-4 text-2xl font-bold capitalize text-primary">{section}</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item, index) => {
                const title =
                  (item["title"] as string | undefined) ||
                  (item["nom"] as string | undefined) ||
                  (item["name"] as string | undefined);
                const priceObject = item["price"] as
                  | { formatted?: string; amount?: number }
                  | string
                  | undefined;
                const totalPrice = item["totalPrice"] as { formatted?: string } | undefined;
                const price =
                  typeof priceObject === "string"
                    ? priceObject
                    : priceObject?.formatted || totalPrice?.formatted;
                const link =
                  (item["link"] as string | undefined) ||
                  (item["url"] as string | undefined) ||
                  (item["website"] as string | undefined);
                const vendor = item["vendor"] as string | undefined;

                return (
                  <Card key={`${section}-${index}`} className="p-4">
                    <h3 className="font-semibold">{title || "Résultat"}</h3>
                    {vendor ? <p className="text-sm text-muted">{vendor}</p> : null}
                    {price ? <p>{price}</p> : null}
                    {link ? (
                      <a href={link} className="text-primary">
                        Voir
                      </a>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
