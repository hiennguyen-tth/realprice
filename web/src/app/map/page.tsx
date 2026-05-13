"use client";

import dynamic from "next/dynamic";
import { useState, Suspense } from "react";
import { MapModeToggle } from "@/components/map/MapModeToggle";
import { FilterBar } from "@/components/map/FilterBar";
import { CategoryScroll } from "@/components/map/CategoryScroll";
import { ListingsPanel } from "@/components/map/ListingsPanel";
import { CompareTray } from "@/components/comparison/CompareTray";
import { MapSkeleton } from "@/components/common/Skeleton";
import { useMapStore } from "@/store/mapStore";
import { useLandMarkers } from "@/hooks/useLandMarkers";
import type { LandMarker, BoundingBox } from "@/types";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <MapSkeleton /> }
);

const LandSidepanel = dynamic(
  () => import("@/components/map/LandSidepanel").then((m) => m.LandSidepanel),
  { ssr: false }
);

export default function MapPage() {
  const { selectedLandId, setSelectedLandId } = useMapStore();
  const [currentBbox, setCurrentBbox] = useState<BoundingBox | null>(null);
  const [currentZoom, setCurrentZoom] = useState(12);
  const { markers, isLoading } = useLandMarkers(currentBbox, currentZoom);

  const handleLandSelect = (marker: LandMarker) => {
    setSelectedLandId(marker.id);
  };

  const handleBboxChange = (bbox: BoundingBox, zoom?: number) => {
    setCurrentBbox(bbox);
    if (zoom) setCurrentZoom(zoom);
  };

  return (
    <div className="flex flex-col h-[calc(100svh-56px)] md:h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* ── DESKTOP LAYOUT: map left, panel right ──────────────────── */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {/* Map controls overlay */}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-3 pointer-events-none">
            <div className="pointer-events-auto">
              <MapModeToggle />
            </div>
            <div className="pointer-events-auto bg-white rounded-xl shadow-card border border-border px-3 py-2">
              <FilterBar />
            </div>
          </div>

          <Suspense fallback={<MapSkeleton />}>
            <MapView
              onLandSelect={handleLandSelect}
              onBboxChange={handleBboxChange}
              className="w-full h-full"
            />
          </Suspense>
        </div>

        {/* Right panel: categories + listings (or land detail) */}
        <div className="w-[380px] flex flex-col bg-white border-l border-border overflow-hidden shadow-panel">
          {selectedLandId ? (
            <LandSidepanel
              landId={selectedLandId}
              onClose={() => setSelectedLandId(null)}
            />
          ) : (
            <>
              {/* Header */}
              <div className="px-4 pt-4 pb-2 border-b border-border">
                <h2 className="text-sm font-bold text-gray-900">
                  {markers.length > 0
                    ? `${markers.length} vị trí trong khu vực`
                    : currentBbox
                      ? "Không có tin đăng trong khu vực này"
                      : "Đang tải bản đồ..."}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {markers.length > 0 ? "Sắp xếp theo giá thấp nhất" : "Di chuyển bản đồ hoặc dùng nút vị trí để tìm BDS gần bạn"}
                </p>
              </div>

              {/* Categories */}
              <div className="border-b border-border py-1">
                <CategoryScroll />
              </div>

              {/* Filter chips */}
              <div className="px-4 py-2 border-b border-border">
                <FilterBar />
              </div>

              {/* Listing cards — vertical scroll */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : markers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                    <span className="text-4xl mb-3">🔍</span>
                    <p className="text-sm text-center">Di chuyển hoặc zoom bản đồ để xem bất động sản</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {[...markers]
                      .sort((a, b) => a.pricePerM2 - b.pricePerM2)
                      .map((marker) => (
                        <DesktopMarkerCard
                          key={marker.id}
                          marker={marker}
                          isSelected={selectedLandId === marker.id}
                          onClick={() => handleLandSelect(marker)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT: map top, panel bottom ───────────────────── */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden">
        {/* Map (top ~50%) */}
        <div className="relative h-[45%] min-h-[320px]">
          <div className="absolute top-2 left-2 right-2 z-20 flex items-start justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto shrink-0">
              <MapModeToggle compact />
            </div>
            <div className="pointer-events-auto min-w-0 max-w-[48vw] bg-white/95 rounded-xl shadow-card border border-border px-1.5 py-1.5">
              <FilterBar compact />
            </div>
          </div>
          <Suspense fallback={<MapSkeleton />}>
            <MapView
              onLandSelect={handleLandSelect}
              onBboxChange={handleBboxChange}
              className="w-full h-full"
            />
          </Suspense>
        </div>

        {/* Bottom panel */}
        <div className="flex flex-col flex-1 min-h-0 bg-white overflow-hidden border-t border-border rounded-t-2xl -mt-3 relative z-10 shadow-panel pb-[env(safe-area-inset-bottom)]">
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Count */}
          <div className="px-4 pb-1">
            <p className="text-xs font-semibold text-gray-700">
              {markers.length > 0
                ? `${markers.length} vị trí · Giá thấp nhất trước`
                : currentBbox
                  ? "Không có tin đăng trong khu vực này — thử zoom ra hoặc di chuyển bản đồ"
                  : "Đang tải..."}
            </p>
          </div>

          {/* Categories */}
          <div className="border-b border-gray-100">
            <CategoryScroll compact />
          </div>

          {/* Horizontal listing cards scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-2">
            <ListingsPanel
              markers={markers}
              selectedLandId={selectedLandId}
              onMarkerSelect={handleLandSelect}
              isLoading={isLoading}
            />
          </div>

          {/* Land sidepanel as overlay on mobile */}
          {selectedLandId && (
            <div className="absolute inset-0 bg-white z-20 overflow-y-auto rounded-t-2xl">
              <LandSidepanel
                landId={selectedLandId}
                onClose={() => setSelectedLandId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Compare tray */}
      <CompareTray />
    </div>
  );
}

// ── Desktop vertical listing card ────────────────────────────────────────────

function formatPriceShort(pricePerM2: number): string {
  if (pricePerM2 >= 1_000_000_000) {
    return `${(pricePerM2 / 1_000_000_000).toFixed(1)} tỷ/m²`;
  }
  if (pricePerM2 >= 1_000_000) {
    return `${Math.round(pricePerM2 / 1_000_000)} triệu/m²`;
  }
  return `${pricePerM2.toLocaleString("vi")}đ/m²`;
}

const GRADIENTS = [
  "from-orange-400 to-red-400",
  "from-blue-400 to-cyan-400",
  "from-green-400 to-teal-400",
  "from-purple-400 to-pink-400",
  "from-yellow-400 to-orange-400",
];

function DesktopMarkerCard({
  marker,
  isSelected,
  onClick,
}: {
  marker: LandMarker;
  isSelected: boolean;
  onClick: () => void;
}) {
  const gradient = GRADIENTS[marker.id.charCodeAt(0) % GRADIENTS.length];
  return (
    <article
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 ${isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-transparent hover:border-border hover:bg-gray-50"
        }`}
    >
      {/* Thumbnail */}
      <div
        className={`w-20 h-20 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}
      >
        🏘️
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {marker.address}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{marker.district}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-primary">
            {formatPriceShort(marker.pricePerM2)}
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {marker.totalListings} tin
          </span>
        </div>
      </div>
    </article>
  );
}
