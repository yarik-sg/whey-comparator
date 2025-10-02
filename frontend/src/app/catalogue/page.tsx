"use client";

import { useEffect, useState } from "react";

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
            return value ?? "";
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
                  {headers.map((h, idx) => (
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
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3">
                        {typeof cell === "string" && cell.startsWith("http") ? (
                          <a
                            href={cell}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {cell.length > 30 ? cell.slice(0, 30) + "..." : cell}
                          </a>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
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
