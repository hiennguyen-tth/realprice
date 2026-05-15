"use client";

import { useRef, useCallback, useEffect, useState } from "react";
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
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">(
    MAPBOX_TOKEN ? "loading" : "error"
  );

  useEffect(() => {
    if (mapStatus !== "loading") return;
    const timeout = window.setTimeout(() => setMapStatus("error"), 8000);
    return () => window.clearTimeout(timeout);
  }, [mapStatus]);

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
    setMapStatus("ready");
    const bbox = getCurrentBbox(evt.target);
    if (bbox) {
      setCurrentBbox(bbox);
      onBboxChange?.(bbox, viewport.zoom);
    }
  }, [getCurrentBbox, onBboxChange, setIsMapLoaded, viewport.zoom]);

  const { markers } = useLandMarkers(currentBbox, viewport.zoom);
  const { heatmapAreas } = useHeatmap(currentBbox, viewport.zoom, mapMode === "heatmap");
  const zoom = viewport.zoom;

  return (
    <div className={`${className} relative`} aria-label="Bản đồ giá bất động sản">
      {mapStatus === "error" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 px-4">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5-2.5V5l5 2.5M9 20l6-3m-6 3V7.5m6 9.5l6 3V7.5L15 4m0 13V4m0 0L9 7.5" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Không tải được bản đồ</h2>
            <p className="mt-2 text-sm text-gray-500">
              Bạn vẫn có thể xem danh sách khu vực và tin nổi bật được lấy từ dữ liệu toàn quốc.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Thử lại
              </button>
              <a
                href="/tim-kiem"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Xem danh sách tin
              </a>
            </div>
          </div>
        </div>
      )}
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
        onError={() => setMapStatus("error")}
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
          <HeatmapLayer
            areas={heatmapAreas}
            onAreaClick={(area) => {
              // Find matching land marker và select
              const match = markers.find(m => m.district === area.district);
              if (match) {
                setSelectedLandId(match.id);
                onLandSelect?.(match);
              }
            }}
          />
        )}

        {/* Marker mode — limit markers theo zoom để tránh quá tải */}
        {mapMode === "markers" && (() => {
          const maxMarkers = zoom < 10 ? 20 : zoom < 12 ? 50 : zoom < 14 ? 100 : 200;
          const visibleMarkers = markers
            .sort((a, b) => b.totalListings - a.totalListings)
            .slice(0, maxMarkers);
          return visibleMarkers.map((marker) => (
            <PriceBubble
              key={marker.id}
              marker={marker}
              isSelected={selectedLandId === marker.id}
              zoom={zoom}
              onClick={() => {
                setSelectedLandId(marker.id);
                onLandSelect?.(marker);
              }}
            />
          ));
        })()}
      </Map>
    </div>
  );
}
