"use client";

import { useFilterStore } from "@/store/filterStore";
import type { ListingType } from "@/types";
import { clsx } from "clsx";

const LISTING_TYPES: Array<{ value: ListingType | ""; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "dat_nen", label: "Đất nền" },
  { value: "nha_pho", label: "Nhà phố" },
  { value: "chung_cu", label: "Chung cư" },
  { value: "biet_thu", label: "Biệt thự" },
  { value: "van_phong", label: "Văn phòng" },
];

const PRICE_RANGES = [
  { label: "Tất cả", min: undefined, max: undefined },
  { label: "Dưới 2 tỷ", min: undefined, max: 2_000_000_000 },
  { label: "2–5 tỷ", min: 2_000_000_000, max: 5_000_000_000 },
  { label: "5–10 tỷ", min: 5_000_000_000, max: 10_000_000_000 },
  { label: "Trên 10 tỷ", min: 10_000_000_000, max: undefined },
];

export function FilterBar({ compact = false }: { compact?: boolean }) {
  const {
    listingType,
    minPrice,
    maxPrice,
    setListingType,
    setMinPrice,
    setMaxPrice,
    resetFilters,
  } = useFilterStore();

  const hasActiveFilters =
    !!listingType || minPrice !== undefined || maxPrice !== undefined;

  const currentPriceRange = PRICE_RANGES.findIndex(
    (r) => r.min === minPrice && r.max === maxPrice
  );

  return (
    <div className={clsx("flex items-center gap-2 overflow-x-auto no-scrollbar", compact ? "max-w-full py-0" : "py-1")}>
      {/* Loại BDS */}
      <select
        value={listingType}
        onChange={(e) => setListingType(e.target.value as ListingType | "")}
        className={clsx(
          "shrink-0 border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
          compact ? "max-w-[128px] px-2.5 py-1.5 text-sm" : "px-3 py-1.5 text-sm"
        )}
      >
        {LISTING_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Khoảng giá */}
      <select
        value={currentPriceRange}
        onChange={(e) => {
          const range = PRICE_RANGES[Number(e.target.value)];
          setMinPrice(range.min);
          setMaxPrice(range.max);
        }}
        className={clsx(
          "shrink-0 border border-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer",
          compact ? "hidden" : "px-3 py-1.5 text-sm"
        )}
      >
        {PRICE_RANGES.map((r, i) => (
          <option key={i} value={i}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className={clsx(
            "shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm rounded-full",
            "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
          )}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Xóa lọc
        </button>
      )}
    </div>
  );
}
