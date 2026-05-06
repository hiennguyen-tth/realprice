"use client";

import { create } from "zustand";
import type { ListingType, ListingFilters } from "@/types";

interface FilterState extends ListingFilters {
  listingType: ListingType | "";
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minArea: number | undefined;
  maxArea: number | undefined;
  sortBy: ListingFilters["sortBy"];
  setListingType: (type: ListingType | "") => void;
  setMinPrice: (price: number | undefined) => void;
  setMaxPrice: (price: number | undefined) => void;
  setMinArea: (area: number | undefined) => void;
  setMaxArea: (area: number | undefined) => void;
  setSortBy: (sort: ListingFilters["sortBy"]) => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  resetFilters: () => void;
  toQueryParams: () => ListingFilters;
}

const DEFAULT_FILTERS: ListingFilters = {
  listingType: "",
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  sortBy: "newest",
};

export const useFilterStore = create<FilterState>((set, get) => ({
  listingType: "",
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  sortBy: "newest",

  setListingType: (listingType) => set({ listingType }),
  setMinPrice: (minPrice) => set({ minPrice }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setMinArea: (minArea) => set({ minArea }),
  setMaxArea: (maxArea) => set({ maxArea }),
  setSortBy: (sortBy) => set({ sortBy }),

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),

  resetFilters: () => set({ ...DEFAULT_FILTERS }),

  toQueryParams: () => {
    const { listingType, minPrice, maxPrice, minArea, maxArea, sortBy } = get();
    const params: ListingFilters = {};
    if (listingType) params.listingType = listingType;
    if (minPrice !== undefined) params.minPrice = minPrice;
    if (maxPrice !== undefined) params.maxPrice = maxPrice;
    if (minArea !== undefined) params.minArea = minArea;
    if (maxArea !== undefined) params.maxArea = maxArea;
    if (sortBy) params.sortBy = sortBy;
    return params;
  },
}));
