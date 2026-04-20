"use client";

import { useMapStore } from "@/store/mapStore";
import { clsx } from "clsx";
import type { MapMode } from "@/types";

const MODES: Array<{ value: MapMode; label: string; icon: React.ReactNode }> = [
  {
    value: "markers",
    label: "Tin đăng",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    value: "heatmap",
    label: "Heatmap",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
  },
];

export function MapModeToggle() {
  const { mapMode, setMapMode } = useMapStore();

  return (
    <div className="flex items-center bg-white rounded-xl shadow-card border border-border p-1 gap-1">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setMapMode(mode.value)}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            mapMode === mode.value
              ? "bg-primary text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {mode.icon}
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
