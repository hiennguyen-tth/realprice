"use client";

import Link from "next/link";
import { clsx } from "clsx";
import type { LandMarker } from "@/types";

const DISTRICT_COLORS: Record<string, string> = {
  "Quận 1": "from-red-400 to-orange-400",
  "Quận 2": "from-blue-400 to-cyan-400",
  "Quận 3": "from-purple-400 to-pink-400",
  "Quận 7": "from-green-400 to-teal-400",
  "Bình Thạnh": "from-yellow-400 to-orange-400",
  "Hoàn Kiếm": "from-indigo-400 to-blue-400",
  "Hải Châu": "from-teal-400 to-green-400",
};

function getGradient(district: string) {
  return DISTRICT_COLORS[district] ?? "from-primary to-orange-400";
}

function formatPrice(pricePerM2: number): string {
  if (pricePerM2 >= 1_000_000_000) {
    return `${(pricePerM2 / 1_000_000_000).toFixed(1)} tỷ/m²`;
  }
  if (pricePerM2 >= 1_000_000) {
    return `${Math.round(pricePerM2 / 1_000_000)} triệu/m²`;
  }
  return `${pricePerM2.toLocaleString("vi")}đ/m²`;
}

interface MarkerCardProps {
  marker: LandMarker;
  isSelected: boolean;
  onClick: () => void;
}

function MarkerCard({ marker, isSelected, onClick }: MarkerCardProps) {
  return (
    <article
      onClick={onClick}
      className={clsx(
        "w-48 shrink-0 bg-white rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-border shadow-card hover:shadow-card-hover hover:border-primary/30"
      )}
    >
      {/* Thumbnail */}
      <div
        className={clsx(
          "h-28 bg-gradient-to-br flex flex-col items-center justify-center relative",
          getGradient(marker.district)
        )}
      >
        <span className="text-white text-3xl">🏘️</span>
        {/* Cheapest price badge */}
        <div className="absolute bottom-2 left-2 bg-white/95 text-primary font-bold text-xs px-2 py-1 rounded-full shadow-sm">
          {formatPrice(marker.pricePerM2)}
        </div>
        {marker.totalListings > 1 && (
          <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full">
            {marker.totalListings} tin
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
          {marker.address}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {marker.district}
        </p>
        <Link
          href={`/listing/${marker.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 block text-center text-xs font-semibold text-primary hover:text-primary-dark border border-primary/30 hover:bg-primary/5 py-1 rounded-lg transition-colors"
        >
          Xem {marker.totalListings} tin
        </Link>
      </div>
    </article>
  );
}

interface ListingsPanelProps {
  markers: LandMarker[];
  selectedLandId: string | null;
  onMarkerSelect: (marker: LandMarker) => void;
  isLoading?: boolean;
}

export function ListingsPanel({
  markers,
  selectedLandId,
  onMarkerSelect,
  isLoading,
}: ListingsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-48 h-44 shrink-0 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-400">
        <span className="text-3xl mb-2">🔍</span>
        <p className="text-sm">Di chuyển bản đồ để xem kết quả</p>
      </div>
    );
  }

  // Sort: cheapest first
  const sorted = [...markers].sort((a, b) => a.pricePerM2 - b.pricePerM2);

  return (
    <div className="flex items-start gap-3 overflow-x-auto no-scrollbar px-4 py-2 pb-3">
      {sorted.map((marker) => (
        <MarkerCard
          key={marker.id}
          marker={marker}
          isSelected={selectedLandId === marker.id}
          onClick={() => onMarkerSelect(marker)}
        />
      ))}
    </div>
  );
}
