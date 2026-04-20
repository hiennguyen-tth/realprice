"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import {
  formatShortPrice,
  formatArea,
  formatPricePerM2,
  formatListingType,
  formatDate,
} from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import type { ComparisonItem, ComparisonAnalysis } from "@/types";

interface ComparisonTableProps {
  items: ComparisonItem[];
  analysis: ComparisonAnalysis;
}

const ROWS = [
  { label: "Giá bán", key: "price" as const },
  { label: "Diện tích", key: "area" as const },
  { label: "Giá/m²", key: "pricePerM2" as const },
  { label: "Loại BDS", key: "listingType" as const },
  { label: "Địa chỉ", key: "address" as const },
  { label: "Ngày đăng", key: "createdAt" as const },
];

export function ComparisonTable({ items, analysis }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-max"
        style={{ minWidth: `${Math.max(600, items.length * 220)}px` }}
      >
        {/* Header row: listing cards */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}>
          <div className="flex items-end pb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              So sánh
            </span>
          </div>
          {items.map((item, idx) => {
            const isBest = idx === analysis.bestValueIndex;
            const isCheapest = idx === analysis.cheapestIndex;
            return (
              <div
                key={item.listingId}
                className={clsx(
                  "bg-white rounded-2xl border-2 overflow-hidden shadow-card transition-all",
                  isBest ? "border-primary" : "border-border"
                )}
              >
                {isBest && (
                  <div className="bg-primary text-white text-xs font-bold text-center py-1.5">
                    Giá/m² tốt nhất
                  </div>
                )}
                {!isBest && isCheapest && (
                  <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5">
                    Giá rẻ nhất
                  </div>
                )}
                <div className="relative h-36 bg-gray-100">
                  {item.listing.images[0] ? (
                    <Image
                      src={item.listing.images[0]}
                      alt={item.listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-base font-bold text-primary">
                    {formatShortPrice(item.listing.price)}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-snug">
                    {item.listing.title}
                  </p>
                  <Link
                    href={`/listing/${item.listing.id}`}
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    Xem chi tiết →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {ROWS.map((row, rowIdx) => (
          <div
            key={row.key}
            className={clsx(
              "grid gap-3 py-3 border-b border-border",
              rowIdx % 2 === 0 ? "bg-white" : "bg-surface-secondary"
            )}
            style={{ gridTemplateColumns: `160px repeat(${items.length}, 1fr)` }}
          >
            <div className="flex items-center px-3">
              <span className="text-xs font-semibold text-gray-500">{row.label}</span>
            </div>
            {items.map((item, idx) => {
              const listing = item.listing;
              let value: React.ReactNode = "—";
              let highlight = false;

              switch (row.key) {
                case "price":
                  value = (
                    <span className={clsx(
                      "font-bold",
                      idx === analysis.cheapestIndex ? "text-green-600" : "text-gray-900"
                    )}>
                      {formatShortPrice(listing.price)}
                    </span>
                  );
                  highlight = idx === analysis.cheapestIndex;
                  break;
                case "area":
                  value = (
                    <span className={clsx(
                      "font-semibold",
                      idx === analysis.largestAreaIndex ? "text-blue-600" : "text-gray-900"
                    )}>
                      {formatArea(listing.area)}
                    </span>
                  );
                  highlight = idx === analysis.largestAreaIndex;
                  break;
                case "pricePerM2":
                  value = (
                    <span className={clsx(
                      "font-bold",
                      idx === analysis.bestValueIndex ? "text-primary" : "text-gray-900"
                    )}>
                      {formatPricePerM2(listing.pricePerM2)}
                    </span>
                  );
                  highlight = idx === analysis.bestValueIndex;
                  break;
                case "listingType":
                  value = <Badge variant="primary">{formatListingType(listing.listingType)}</Badge>;
                  break;
                case "address":
                  value = <span className="text-xs text-gray-600">{listing.address}</span>;
                  break;
                case "createdAt":
                  value = <span className="text-xs text-gray-500">{formatDate(listing.createdAt)}</span>;
                  break;
              }

              return (
                <div
                  key={item.listingId}
                  className={clsx(
                    "px-3 py-1 flex items-center text-sm rounded-lg",
                    highlight && "bg-primary/5"
                  )}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
