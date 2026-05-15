"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { slugifyVietnamese } from "@/lib/slugs";
import type { LandMarker } from "@/types";

const GRADIENTS = [
  "from-red-400 to-orange-400",
  "from-blue-400 to-cyan-400",
  "from-purple-400 to-pink-400",
  "from-green-400 to-teal-400",
  "from-yellow-400 to-orange-400",
  "from-indigo-400 to-blue-400",
  "from-teal-400 to-green-400",
];

function getGradient(district: string) {
  const hash = Array.from(district).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
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
  const landHref = `/land/${encodeURIComponent(slugifyVietnamese(marker.district))}/${encodeURIComponent(slugifyVietnamese(marker.address))}`;

  return (
    <article
      onClick={onClick}
      className={clsx(
        "w-40 sm:w-48 shrink-0 bg-white rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-border shadow-card hover:shadow-card-hover hover:border-primary/30"
      )}
    >
      {/* Thumbnail */}
      <div
        className={clsx(
          "h-24 sm:h-28 bg-gradient-to-br flex flex-col items-center justify-center relative",
          getGradient(marker.district)
        )}
      >
        <svg className="h-8 w-8 text-white sm:h-9 sm:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 21h18M5 21V9.5L12 4l7 5.5V21M9 21v-6h6v6M8 11h.01M16 11h.01" />
        </svg>
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
      <div className="p-2.5 sm:p-3">
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
          href={landHref}
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
  hasError?: boolean;
}

export function ListingsPanel({
  markers,
  selectedLandId,
  onMarkerSelect,
  isLoading,
  hasError,
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

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-5 text-center text-gray-500">
        <svg className="w-9 h-9 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
        <p className="text-sm font-semibold text-gray-700">Không tải được dữ liệu</p>
        <a href="/tim-kiem" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
          Xem danh sách tin
        </a>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-400">
        <svg className="w-9 h-9 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5-2.5V5l5 2.5m0 12.5l6-3m-6 3V7.5m6 9.5l6 3V7.5L15 4m0 13V4m0 0L9 7.5" />
        </svg>
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
