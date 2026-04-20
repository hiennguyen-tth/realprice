"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Listing } from "@/types";

const MAX_COMPARISON_ITEMS = 4;

interface ComparisonState {
  items: Listing[];
  addItem: (listing: Listing) => void;
  removeItem: (listingId: string) => void;
  clearAll: () => void;
  isInComparison: (listingId: string) => boolean;
  isFull: boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      items: [],
      isFull: false,

      addItem: (listing) => {
        const { items } = get();
        if (items.length >= MAX_COMPARISON_ITEMS) return;
        if (items.some((i) => i.id === listing.id)) return;
        const newItems = [...items, listing];
        set({ items: newItems, isFull: newItems.length >= MAX_COMPARISON_ITEMS });
      },

      removeItem: (listingId) => {
        const newItems = get().items.filter((i) => i.id !== listingId);
        set({ items: newItems, isFull: newItems.length >= MAX_COMPARISON_ITEMS });
      },

      clearAll: () => set({ items: [], isFull: false }),

      isInComparison: (listingId) =>
        get().items.some((i) => i.id === listingId),
    }),
    {
      name: "realprice-comparison",
      version: 1,
    }
  )
);
