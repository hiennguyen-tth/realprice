"use client";

import { useFilterStore } from "@/store/filterStore";
import type { ListingType } from "@/types";
import { clsx } from "clsx";

const CATEGORIES: Array<{
  value: ListingType | "";
  label: string;
  icon: string;
  color: string;
}> = [
  { value: "", label: "Tất cả", icon: "🏘️", color: "bg-gray-100" },
  { value: "dat_nen", label: "Đất nền", icon: "🌿", color: "bg-green-100" },
  { value: "nha_pho", label: "Nhà phố", icon: "🏠", color: "bg-blue-100" },
  { value: "chung_cu", label: "Chung cư", icon: "🏢", color: "bg-purple-100" },
  { value: "biet_thu", label: "Biệt thự", icon: "🏰", color: "bg-yellow-100" },
  { value: "van_phong", label: "Văn phòng", icon: "🏬", color: "bg-red-100" },
];

export function CategoryScroll() {
  const { listingType, setListingType } = useFilterStore();

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-2">
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
                "w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all",
                isActive
                  ? "ring-2 ring-primary ring-offset-2 scale-110"
                  : "hover:scale-105",
                cat.color
              )}
            >
              {cat.icon}
            </div>
            <span
              className={clsx(
                "text-xs font-medium whitespace-nowrap",
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
