"use client";

import Image from "next/image";
import { useComparison } from "@/hooks/useComparison";

export function CompareTray() {
  const { items, removeItem, clearAll, canCompare, startComparison, isCreatingComparison } =
    useComparison();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary shadow-panel animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Items */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <span className="shrink-0 text-xs font-semibold text-gray-600">
              So sánh ({items.length}/4):
            </span>
            {items.map((listing) => (
              <div
                key={listing.id}
                className="shrink-0 flex items-center gap-1.5 bg-surface-secondary border border-border rounded-full px-2 py-1"
              >
                {listing.images[0] && (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-xs text-gray-700 max-w-[100px] truncate">
                  {listing.title}
                </span>
                <button
                  onClick={() => removeItem(listing.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Xóa"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Xóa tất cả
            </button>
            <button
              onClick={() => startComparison()}
              disabled={!canCompare || isCreatingComparison}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isCreatingComparison ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Đang tạo...
                </>
              ) : (
                `So sánh ${items.length} tin`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
