"use client";

import { Marker } from "react-map-gl";
import { clsx } from "clsx";
import { formatShortPrice } from "@/lib/formatters";
import type { LandMarker } from "@/types";

interface PriceBubbleProps {
  marker: LandMarker;
  isSelected: boolean;
  onClick: () => void;
}

export function PriceBubble({ marker, isSelected, onClick }: PriceBubbleProps) {
  const price = formatShortPrice(marker.pricePerM2);

  return (
    <Marker
      longitude={marker.location.longitude}
      latitude={marker.location.latitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <button
        className={clsx(
          "relative flex flex-col items-center cursor-pointer transition-all duration-150 group",
          "focus:outline-none"
        )}
        aria-label={`Giá ${price}/m² tại ${marker.address}`}
      >
        {/* Bubble */}
        <div
          className={clsx(
            "px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-bubble",
            "transition-all duration-150 group-hover:scale-110",
            isSelected
              ? "bg-primary text-white scale-110 ring-2 ring-white ring-offset-1"
              : "bg-white text-primary border-2 border-primary"
          )}
        >
          {price}
        </div>

        {/* Count badge */}
        {marker.totalListings > 1 && (
          <div
            className={clsx(
              "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold",
              "flex items-center justify-center",
              isSelected
                ? "bg-white text-primary"
                : "bg-primary text-white"
            )}
          >
            {marker.totalListings > 9 ? "9+" : marker.totalListings}
          </div>
        )}

        {/* Pointer */}
        <div
          className={clsx(
            "w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent",
            "-mt-0.5",
            isSelected ? "border-t-primary" : "border-t-primary"
          )}
          style={{ borderTopWidth: 6 }}
        />
      </button>
    </Marker>
  );
}
