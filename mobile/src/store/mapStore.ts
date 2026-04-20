import {create} from 'zustand';
import type {MapMode} from '../types';

interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapState {
  viewport: Viewport;
  mapMode: MapMode;
  selectedLandId: string | null;
  isMapReady: boolean;
}

interface MapActions {
  setViewport: (viewport: Partial<Viewport>) => void;
  setMapMode: (mode: MapMode) => void;
  setSelectedLandId: (landId: string | null) => void;
  setMapReady: (ready: boolean) => void;
  resetViewport: () => void;
}

type MapStore = MapState & MapActions;

// Default center: Ho Chi Minh City
const DEFAULT_VIEWPORT: Viewport = {
  latitude: 10.7769,
  longitude: 106.7009,
  zoom: 12,
};

export const useMapStore = create<MapStore>(set => ({
  viewport: DEFAULT_VIEWPORT,
  mapMode: 'marker',
  selectedLandId: null,
  isMapReady: false,

  setViewport: (viewport) =>
    set(state => ({
      viewport: {...state.viewport, ...viewport},
    })),

  setMapMode: (mode) => set({mapMode: mode}),

  setSelectedLandId: (landId) => set({selectedLandId: landId}),

  setMapReady: (ready) => set({isMapReady: ready}),

  resetViewport: () => set({viewport: DEFAULT_VIEWPORT}),
}));
