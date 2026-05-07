"use client";

import { useRef, useCallback, useState } from "react";
import Map, {
  NavigationControl,
  GeolocateControl,
  MapRef,
  ViewStateChangeEvent,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapStore } from "@/store/mapStore";
import { viewportToBbox } from "@/lib/geoUtils";
import { useLandMarkers } from "@/hooks/useLandMarkers";
import { useHeatmap } from "@/hooks/useHeatmap";
import { PriceBubble } from "./PriceBubble";
import { HeatmapLayer } from "./HeatmapLayer";
import type { LandMarker, BoundingBox } from "@/types";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface MapViewProps {
  onLandSelect?: (marker: LandMarker) => void;
  onBboxChange?: (bbox: BoundingBox, zoom?: number) => void;
  className?: string;
  interactive?: boolean;
}

export function MapView({
  onLandSelect,
  onBboxChange,
  className = "w-full h-full",
  interactive = true,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const {
    viewport,
    mapMode,
    selectedLandId,
    setViewport,
    setSelectedLandId,
    setIsMapLoaded,
  } = useMapStore();

  const [currentBbox, setCurrentBbox] = useState<BoundingBox | null>(null);

  // Derive bbox from map bounds
  const getCurrentBbox = useCallback((map?: any): BoundingBox | null => {
    const mapInstance = map ?? mapRef.current?.getMap();
    if (!mapInstance) return null;
    const bounds = mapInstance.getBounds();
    if (!bounds) return null;
    return viewportToBbox({
      _sw: bounds.getSouthWest(),
      _ne: bounds.getNorthEast(),
    });
  }, []);

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => {
      setViewport({
        longitude: evt.viewState.longitude,
        latitude: evt.viewState.latitude,
        zoom: evt.viewState.zoom,
        bearing: evt.viewState.bearing,
        pitch: evt.viewState.pitch,
      });
      const bbox = getCurrentBbox();
      if (bbox) {
        setCurrentBbox(bbox);
        onBboxChange?.(bbox, evt.viewState.zoom);
      }
    },
    [getCurrentBbox, onBboxChange, setViewport]
  );

  const handleLoad = useCallback((evt: any) => {
    setIsMapLoaded(true);
    const bbox = getCurrentBbox(evt.target?.getMap?.());
    if (bbox) {
      setCurrentBbox(bbox);
      onBboxChange?.(bbox);
    }
  }, [getCurrentBbox, onBboxChange, setIsMapLoaded]);

  const { markers } = useLandMarkers(currentBbox, viewport.zoom);
  const { heatmapAreas } = useHeatmap(currentBbox, viewport.zoom, mapMode === "heatmap");

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        longitude={viewport.longitude}
        latitude={viewport.latitude}
        zoom={viewport.zoom}
        bearing={viewport.bearing ?? 0}
        pitch={viewport.pitch ?? 0}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onMove={handleMove}
        onLoad={handleLoad}
        interactive={interactive}
        attributionControl={false}
      >
        {interactive && (
          <>
            <NavigationControl position="bottom-right" />
            <GeolocateControl position="bottom-right" />
          </>
        )}

        {/* Heatmap mode */}
        {mapMode === "heatmap" && (
          <HeatmapLayer areas={heatmapAreas} />
        )}

        {/* Marker mode */}
        {mapMode === "markers" &&
          markers.map((marker) => (
            <PriceBubble
              key={marker.id}
              marker={marker}
              isSelected={selectedLandId === marker.id}
              onClick={() => {
                setSelectedLandId(marker.id);
                onLandSelect?.(marker);
              }}
            />
          ))}
      </Map>
    </div>
  );
}
