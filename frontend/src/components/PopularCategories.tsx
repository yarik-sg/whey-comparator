"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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
    <section className="relative bg-[#0b1320] py-20">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent"></div>
      <div className="container relative mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Catégories populaires</h2>
          <p className="mt-4 text-lg text-gray-300">
            Explorez les segments les plus recherchés par notre communauté et lancez un comparatif en un clic.
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
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:border-orange-400/60 hover:shadow-2xl"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent" />
              </div>
              <div className="relative flex items-start justify-between">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl ${iconColor} shadow-inner`}
                  aria-hidden
                >
                  {icon}
                </span>
                <span className="text-sm font-medium text-orange-200/90">{count.toLocaleString("fr-FR")} produits</span>
              </div>
              <h3 className="relative mt-6 text-xl font-semibold text-white">{label}</h3>
              <p className="relative mt-3 text-sm text-gray-300">{description}</p>
              <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-medium text-orange-200">
                Découvrir
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
