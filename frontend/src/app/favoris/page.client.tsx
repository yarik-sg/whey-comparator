"use client";

import Link from "next/link";
import { Dumbbell, Heart, ShoppingBag } from "lucide-react";

import { GymCard } from "@/components/GymCard";
import { ProductCard } from "@/components/ProductCard";
import { buttonClassName } from "@/components/ui/button";
import {
  selectFavoriteGyms,
  selectFavoriteProducts,
  useFavoritesStore,
} from "@/store/favoritesStore";

export default function FavoritesPageClient() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const productFavorites = selectFavoriteProducts(favorites);
  const gymFavorites = selectFavoriteGyms(favorites);
  const hasFavorites = favorites.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-dark dark:text-[var(--text)]">
            <Heart className="h-7 w-7 text-primary" aria-hidden />
            Vos favoris
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Gardez sous la main vos produits et salles préférés pour les comparer plus facilement et y revenir à tout moment.
          </p>
        </div>
        {hasFavorites ? (
          <Link
            href="/products"
            className={buttonClassName({ variant: "outline", size: "sm", className: "items-center gap-2" })}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Explorer les produits
          </Link>
        ) : null}
      </header>

      {!hasFavorites ? (
        <div className="rounded-3xl border border-accent/70 bg-background/95 p-10 text-center shadow-sm dark:border-accent-d/40 dark:bg-dark/80">
          <Heart className="mx-auto h-12 w-12 text-primary" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-dark dark:text-[var(--text)]">
            Aucun favori pour le moment
          </h2>
          <p className="mt-2 text-sm text-muted">
            Ajoutez des produits ou des salles de sport à vos favoris pour les retrouver facilement ici.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className={buttonClassName({ size: "sm", className: "w-full gap-2 sm:w-auto" })}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Parcourir les produits
            </Link>
            <Link
              href="/gyms"
              className={buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "w-full gap-2 sm:w-auto",
              })}
            >
              <Dumbbell className="h-4 w-4" aria-hidden />
              Trouver une salle
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {productFavorites.length > 0 ? (
            <section>
              <div className="mb-6 flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-2xl font-semibold text-dark dark:text-[var(--text)]">
                  Produits favoris
                </h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {productFavorites.map((favorite) => (
                  <ProductCard key={`favorite-product-${favorite.id}`} product={favorite.product} />
                ))}
              </div>
            </section>
          ) : null}

          {gymFavorites.length > 0 ? (
            <section>
              <div className="mb-6 flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-2xl font-semibold text-dark dark:text-[var(--text)]">Salles favorites</h2>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {gymFavorites.map((favorite) => (
                  <GymCard
                    key={`favorite-gym-${favorite.id}`}
                    gym={favorite.gym}
                    href={favorite.gym.link ?? favorite.gym.website ?? null}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
