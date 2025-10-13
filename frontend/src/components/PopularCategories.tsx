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
          <h2 className="font-heading text-3xl font-semibold text-dark sm:text-4xl dark:text-white">
            Catégories populaires
          </h2>
          <p className="mt-4 text-lg text-muted dark:text-text-2">
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
              <Card className="group relative h-full overflow-hidden border-accent/70 bg-white p-6 text-left shadow-neo transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-accent-d/50 dark:bg-[rgba(30,41,59,0.82)]">
                <div className="absolute inset-x-4 top-4 h-28 rounded-[3rem] bg-gradient-to-r from-primary/5 via-accent/70 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100 dark:from-primary/15 dark:via-[rgba(148,163,184,0.16)]" />
                <div className="relative flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary ${iconColor}`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    {count.toLocaleString("fr-FR")}&nbsp;produits
                  </span>
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-dark dark:text-white">{label}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted dark:text-text-2">{description}</p>
                <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Découvrir la catégorie
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
