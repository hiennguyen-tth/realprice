"use client";

import { useComparison } from "@/hooks/useComparison";
import { clsx } from "clsx";
import type { Listing } from "@/types";

interface CompareButtonProps {
  listing: Listing;
  size?: "sm" | "md";
  className?: string;
}

export function CompareButton({ listing, size = "md", className }: CompareButtonProps) {
  const { toggle, isInComparison, isFull } = useComparison();
  const inComparison = isInComparison(listing.id);
  const disabled = !inComparison && isFull;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(listing);
      }}
      disabled={disabled}
      title={
        inComparison
          ? "Xóa khỏi so sánh"
          : disabled
          ? "Đã đủ 4 tin so sánh"
          : "Thêm vào so sánh"
      }
      className={clsx(
        "flex items-center justify-center gap-1 rounded-lg font-medium transition-all",
        size === "sm" ? "p-1.5" : "px-3 py-1.5 text-sm",
        inComparison
          ? "bg-primary text-white hover:bg-primary-dark"
          : disabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
      aria-pressed={inComparison}
    >
      {size === "sm" ? (
        <svg
          className="w-4 h-4"
          fill={inComparison ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill={inComparison ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{inComparison ? "Đã thêm" : "So sánh"}</span>
        </>
      )}
    </button>
  );
}
