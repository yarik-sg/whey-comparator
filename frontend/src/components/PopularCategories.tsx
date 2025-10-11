"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";

import {
  fetchPopularCategoryCounts,
  popularCategories,
  type PopularCategory,
} from "@/data/popularCategories";

interface PopularCategoriesProps {
  onSelectCategory: (query: string) => void;
}

type CategoryWithCount = PopularCategory & { count: number };

export function PopularCategories({ onSelectCategory }: PopularCategoriesProps) {
  const [categoryData, setCategoryData] = useState<CategoryWithCount[]>(() =>
    popularCategories.map((category) => ({ ...category, count: 0 })),
  );

  useEffect(() => {
    let isMounted = true;

    fetchPopularCategoryCounts().then((counts) => {
      if (!isMounted) {
        return;
      }

      setCategoryData((current) =>
        current.map((category) => ({
          ...category,
          count: counts[category.id] ?? category.count,
        })),
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () =>
      categoryData.map((category, index) => ({
        ...category,
        animationDelay: index * 0.05,
      })),
    [categoryData],
  );

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,102,0,0.15),transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,rgba(253,220,142,0.12),transparent_55%)]" aria-hidden />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-fitidion-dark sm:text-4xl dark:text-white">
            Catégories populaires
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Explorez les univers les plus recherchés par notre communauté et lancez un comparatif en un clic.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-6">
          {cards.map(({ id, label, description, icon, iconColor, query, count, animationDelay }) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onSelectCategory(query)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: animationDelay, duration: 0.4 }}
              className="text-left"
            >
              <Card className="group relative h-full overflow-hidden border-white/20 bg-white/75 p-6 text-left shadow-glass transition hover:-translate-y-1 hover:border-fitidion-orange/30 hover:shadow-fitidion dark:border-white/10 dark:bg-slate-900/60">
                <div className="absolute inset-x-4 top-4 h-28 rounded-[3rem] bg-gradient-to-r from-white/10 via-fitidion-orange/10 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl text-fitidion-orange backdrop-blur ${iconColor}`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="rounded-full bg-fitidion-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fitidion-orange">
                    {count.toLocaleString("fr-FR")}&nbsp;produits
                  </span>
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-fitidion-dark dark:text-white">{label}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
                <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-fitidion-orange">
                  Découvrir
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
