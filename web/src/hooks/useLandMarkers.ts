"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLandsByBbox } from "@/lib/api";
import { bboxToCacheKey } from "@/lib/geoUtils";
import { useFilterStore } from "@/store/filterStore";
import type { BoundingBox, LandMarker } from "@/types";
import debounce from "lodash/debounce";

const CACHE = new Map<string, LandMarker[]>();
const DEBOUNCE_MS = 400;

// zoom < 10 → tỉnh/thành, 10-12 → quận, > 12 → phường/đường
export function getZoomLevel(zoom: number): "province" | "district" | "ward" {
  if (zoom < 10) return "province";
  if (zoom < 13) return "district";
  return "ward";
}

export function useLandMarkers(bbox: BoundingBox | null, zoom: number = 12) {
  const [debouncedBbox, setDebouncedBbox] = useState<BoundingBox | null>(bbox);
  const listingType = useFilterStore((state) => state.listingType);
  const minPrice = useFilterStore((state) => state.minPrice);
  const maxPrice = useFilterStore((state) => state.maxPrice);

  // Debounce bbox updates (triggered by map pan/zoom)
  const debouncedSetBbox = useRef(
    debounce((newBbox: BoundingBox) => {
      setDebouncedBbox(newBbox);
    }, DEBOUNCE_MS)
  ).current;

  useEffect(() => {
    if (bbox) {
      debouncedSetBbox(bbox);
    }
    return () => {
      debouncedSetBbox.cancel();
    };
  }, [bbox, debouncedSetBbox]);

  const zoomLevel = getZoomLevel(zoom);
  const filterKey = [
    listingType || "all",
    minPrice ?? "none",
    maxPrice ?? "none",
  ].join(":");
  const cacheKey = debouncedBbox
    ? `${bboxToCacheKey(debouncedBbox)}:${zoomLevel}:${filterKey}`
    : `nationwide:${zoomLevel}:${filterKey}`;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["landMarkers", cacheKey],
    queryFn: async () => {
      // Check in-memory cache first
      const cached = CACHE.get(cacheKey);
      if (cached) return cached;

      const markers = await getLandsByBbox(debouncedBbox, debouncedBbox ? 200 : 120, {
        listingType: listingType || undefined,
        minPrice,
        maxPrice,
      });
      CACHE.set(cacheKey, markers);

      // Keep cache size reasonable
      if (CACHE.size > 50) {
        const firstKey = CACHE.keys().next().value;
        if (firstKey) CACHE.delete(firstKey);
      }

      return markers;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const invalidateCache = useCallback(() => {
    CACHE.clear();
  }, []);

  return {
    markers: data ?? [],
    isLoading: isLoading && !data,
    isFetching,
    error,
    invalidateCache,
  };
}
