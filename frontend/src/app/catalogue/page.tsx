"use client";

import { useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/SiteFooter";

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

const IMAGE_HEADER_KEYWORDS = ["image", "photo", "visuel", "thumbnail", "cover", "illustration"];

const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;

const URL_REGEX = /^https?:\/\//i;

function isLikelyUrl(value: string) {
  return URL_REGEX.test(value.trim());
}

function isLikelyImageUrl(value: string, headerLabel?: string | null) {
  const trimmed = value.trim();
  if (!isLikelyUrl(trimmed)) {
    return false;
  }

  if (IMAGE_EXTENSION_REGEX.test(trimmed)) {
    return true;
  }

  const normalizedHeader = headerLabel?.toLowerCase() ?? "";
  if (IMAGE_HEADER_KEYWORDS.some((keyword) => normalizedHeader.includes(keyword))) {
    return true;
  }

  return trimmed.includes("googleusercontent") || trimmed.includes("images.unsplash.com");
}

function buildRowPrimaryLabel(row: string[]): string {
  for (const cell of row) {
    const trimmed = cell.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (!isLikelyUrl(trimmed)) {
      return trimmed;
    }
  }

  return "Image du produit";
}

export default function Catalogue() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const res = await fetch(
          "https://docs.google.com/spreadsheets/d/1XeD-sg3cT9WjWQ8O0mabRb1pNeIAY9sOhRUl-jnLND0/gviz/tq?tqx=out:json"
        );
        const text = await res.text();

        const json = JSON.parse(text.substring(47, text.length - 2)) as GoogleSheetResponse;
        const cols = json.table.cols.map((column) => column.label ?? "");
        const data = json.table.rows.map((row) =>
          row.c.map((cell) => {
            const value = cell?.v;
            if (typeof value === "number") {
              return value.toString();
            }
            if (typeof value === "string") {
              return value.trim();
            }
            return "";
          })
        );

        setHeaders(cols);
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

  const normalizedHeaders = useMemo(
    () => headers.map((header, index) => header?.trim() || `Col ${index + 1}`),
    [headers],
  );

  const primaryLabels = useMemo(() => rows.map(buildRowPrimaryLabel), [rows]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#0d1b2a] text-white py-6 shadow-lg">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-orange-500">📘 Catalogue</h1>
          <p className="text-gray-300">Base de données nutrition & suppléments</p>
        </div>
      </header>

      {/* Contenu */}
      <main className="container mx-auto px-6 py-10 flex-1">
        {loading ? (
          <p className="text-center text-gray-600 animate-pulse text-lg">
            ⏳ Chargement du catalogue...
          </p>
        ) : error ? (
          <div className="text-red-600 text-center font-semibold">{error}</div>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#0d1b2a] text-white">
                <tr>
                  {normalizedHeaders.map((h, idx) => (
                    <th key={idx} className="px-4 py-3">
                      {h || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b hover:bg-gray-50 ${
                      i % 2 === 0 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    {row.map((cell, j) => {
                      const headerLabel = normalizedHeaders[j];
                      const value = cell.trim();
                      const isImage = value.length > 0 && isLikelyImageUrl(value, headerLabel);
                      const isUrl = !isImage && value.length > 0 && isLikelyUrl(value);
                      const altText = `${headerLabel || "Image"} — ${primaryLabels[i]}`.trim();

                      return (
                        <td key={j} className="px-4 py-3 align-middle">
                          {isImage ? (
                            <div className="flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element -- remote assets from catalogue */}
                              <img
                                src={value}
                                alt={altText}
                                className="h-24 w-24 rounded-lg border border-gray-200 object-contain"
                                loading="lazy"
                              />
                            </div>
                          ) : isUrl ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {value.length > 40 ? `${value.slice(0, 37)}...` : value}
                            </a>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
