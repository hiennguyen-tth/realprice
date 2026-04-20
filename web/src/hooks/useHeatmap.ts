"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHeatmap } from "@/lib/api";
import { bboxToCacheKey } from "@/lib/geoUtils";
import type { BoundingBox, HeatmapArea } from "@/types";
import debounce from "lodash/debounce";

const DEBOUNCE_MS = 600;

export function useHeatmap(bbox: BoundingBox | null, enabled = true) {
  const [debouncedBbox, setDebouncedBbox] = useState<BoundingBox | null>(bbox);

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

  const cacheKey = debouncedBbox ? bboxToCacheKey(debouncedBbox) : null;

  const { data, isLoading, error } = useQuery<HeatmapArea[]>({
    queryKey: ["heatmap", cacheKey],
    queryFn: () => getHeatmap(debouncedBbox!),
    enabled: enabled && !!debouncedBbox,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    heatmapAreas: data ?? [],
    isLoading,
    error,
  };
}
