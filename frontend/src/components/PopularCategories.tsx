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
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Catégories populaires
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Explorez les univers les plus recherchés par notre communauté et lancez un comparatif en un clic.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
              <Card className="group relative h-full overflow-hidden border-orange-100 bg-white/90 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
                <div className="absolute inset-x-0 top-0 h-20 rounded-3xl bg-gradient-to-r from-orange-50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl ${iconColor}`}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-500">
                    {count.toLocaleString("fr-FR")}&nbsp;produits
                  </span>
                </div>
                <h3 className="relative mt-6 text-xl font-semibold text-slate-900">{label}</h3>
                <p className="relative mt-3 text-sm text-slate-500">{description}</p>
                <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-medium text-orange-500">
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
