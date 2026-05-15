"use client";

import { useFilterStore } from "@/store/filterStore";
import type { ListingType } from "@/types";
import { clsx } from "clsx";

const CATEGORIES: Array<{
  value: ListingType | "";
  label: string;
  icon: "all" | "land" | "house" | "apartment" | "villa" | "office";
  color: string;
}> = [
  { value: "", label: "Tất cả", icon: "all", color: "bg-gray-100" },
  { value: "dat_nen", label: "Đất nền", icon: "land", color: "bg-green-100" },
  { value: "nha_pho", label: "Nhà phố", icon: "house", color: "bg-blue-100" },
  { value: "chung_cu", label: "Chung cư", icon: "apartment", color: "bg-purple-100" },
  { value: "biet_thu", label: "Biệt thự", icon: "villa", color: "bg-yellow-100" },
  { value: "van_phong", label: "Văn phòng", icon: "office", color: "bg-red-100" },
];

function CategoryIcon({ type }: { type: (typeof CATEGORIES)[number]["icon"] }) {
  const common = "h-5 w-5 text-gray-700";
  if (type === "land") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 17c3-4 5-4 8 0s5 4 8 0M5 12c2-3 4-3 7 0s5 3 7 0M12 5v14" />
      </svg>
    );
  }
  if (type === "apartment" || type === "office") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M4 21h16" />
      </svg>
    );
  }
  if (type === "villa") {
    return (
      <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6M8 11h.01M16 11h.01" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 21h18M5 21V9.5L12 4l7 5.5V21M9 21v-6h6v6M8 11h.01M16 11h.01" />
    </svg>
  );
}

export function CategoryScroll({ compact = false }: { compact?: boolean }) {
  const { listingType, setListingType } = useFilterStore();

  return (
    <div className={clsx("flex items-center overflow-x-auto no-scrollbar", compact ? "gap-2 px-4 py-2" : "gap-3 px-4 py-2")}>
      {CATEGORIES.map((cat) => {
        const isActive = listingType === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => setListingType(cat.value as ListingType | "")}
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div
              className={clsx(
                "rounded-full flex items-center justify-center transition-all",
                compact ? "w-11 h-11" : "w-14 h-14",
                isActive
                  ? "ring-2 ring-primary ring-offset-2 scale-110"
                  : "hover:scale-105",
                cat.color
              )}
            >
              <CategoryIcon type={cat.icon} />
            </div>
            <span
              className={clsx(
                "font-medium whitespace-nowrap",
                compact ? "text-[11px]" : "text-xs",
                isActive ? "text-primary" : "text-gray-600"
              )}
            >
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
