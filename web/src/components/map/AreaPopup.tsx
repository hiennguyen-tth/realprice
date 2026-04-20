"use client";

import { Popup } from "react-map-gl";
import { formatShortPrice, formatPricePerM2 } from "@/lib/formatters";
import type { HeatmapArea } from "@/types";

const HEAT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Rẻ", color: "text-green-600" },
  2: { label: "Khá rẻ", color: "text-lime-600" },
  3: { label: "Trung bình", color: "text-yellow-600" },
  4: { label: "Khá đắt", color: "text-orange-600" },
  5: { label: "Đắt", color: "text-red-600" },
};

interface AreaPopupProps {
  area: HeatmapArea;
  longitude: number;
  latitude: number;
  onClose: () => void;
}

export function AreaPopup({ area, longitude, latitude, onClose }: AreaPopupProps) {
  const priceInfo = HEAT_LABELS[area.priceLevel];

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      onClose={onClose}
      closeOnClick={false}
      anchor="bottom"
      className="realprice-popup"
      maxWidth="220px"
    >
      <div className="p-3 min-w-[180px]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-sm text-gray-900 leading-tight">{area.name}</p>
            <p className="text-xs text-gray-500">{area.district}</p>
          </div>
          <span className={`text-xs font-bold ${priceInfo.color}`}>
            {priceInfo.label}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Giá trung bình</span>
            <span className="font-semibold text-gray-900">
              {formatShortPrice(area.avgPrice)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Giá/m²</span>
            <span className="font-semibold text-primary">
              {formatPricePerM2(area.pricePerM2)}
            </span>
          </div>
        </div>

        {/* Price level bar */}
        <div className="mt-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  level <= area.priceLevel ? "opacity-100" : "opacity-20"
                }`}
                style={{
                  backgroundColor:
                    level === 1
                      ? "#22c55e"
                      : level === 2
                      ? "#84cc16"
                      : level === 3
                      ? "#eab308"
                      : level === 4
                      ? "#f97316"
                      : "#ef4444",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Popup>
  );
}
