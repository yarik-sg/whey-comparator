"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import type { GymLocation } from "@/lib/gymLocator";
import type { ProductSummary } from "@/types/api";

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return memoryStorage;
  }

  return window.localStorage;
});

export type FavoriteProductItem = {
  type: "product";
  id: string;
  product: ProductSummary;
};

export type FavoriteGymItem = {
  type: "gym";
  id: string;
  gym: GymLocation;
};

export type FavoriteItem = FavoriteProductItem | FavoriteGymItem;

type FavoriteType = FavoriteItem["type"];

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (type: FavoriteType, id: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  clearFavorites: () => void;
}

const sameFavorite = (a: FavoriteItem, b: FavoriteItem) => a.type === b.type && a.id === b.id;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (item) =>
        set((state) => {
          const index = state.favorites.findIndex((favorite) => sameFavorite(favorite, item));

          if (index !== -1) {
            const updated = state.favorites.slice();
            updated[index] = item;
            return { favorites: updated };
          }

          return { favorites: [...state.favorites, item] };
        }),
      removeFavorite: (type, id) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (favorite) => !(favorite.type === type && favorite.id === id),
          ),
        })),
      toggleFavorite: (item) => {
        const exists = get().favorites.some((favorite) => sameFavorite(favorite, item));

        if (exists) {
          get().removeFavorite(item.type, item.id);
        } else {
          get().addFavorite(item);
        }
      },
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: "wc-favorites",
      storage,
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);

export const selectFavoriteProducts = (favorites: FavoriteItem[]): FavoriteProductItem[] =>
  favorites.filter((favorite): favorite is FavoriteProductItem => favorite.type === "product");

export const selectFavoriteGyms = (favorites: FavoriteItem[]): FavoriteGymItem[] =>
  favorites.filter((favorite): favorite is FavoriteGymItem => favorite.type === "gym");

export const isProductFavorite = (favorites: FavoriteItem[], id: string) =>
  favorites.some((favorite) => favorite.type === "product" && favorite.id === id);

export const isGymFavorite = (favorites: FavoriteItem[], id: string) =>
  favorites.some((favorite) => favorite.type === "gym" && favorite.id === id);
