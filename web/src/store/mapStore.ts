"use client";

import { create } from "zustand";
import type { MapViewport, MapMode } from "@/types";

interface MapState {
  viewport: MapViewport;
  mapMode: MapMode;
  selectedLandId: string | null;
  isMapLoaded: boolean;
  setViewport: (viewport: MapViewport) => void;
  setMapMode: (mode: MapMode) => void;
  setSelectedLandId: (id: string | null) => void;
  setIsMapLoaded: (loaded: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    longitude: 106.6297,
    latitude: 10.8231,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  },
  mapMode: "markers",
  selectedLandId: null,
  isMapLoaded: false,

  setViewport: (viewport) => set({ viewport }),
  setMapMode: (mapMode) => set({ mapMode }),
  setSelectedLandId: (selectedLandId) => set({ selectedLandId }),
  setIsMapLoaded: (isMapLoaded) => set({ isMapLoaded }),
}));
