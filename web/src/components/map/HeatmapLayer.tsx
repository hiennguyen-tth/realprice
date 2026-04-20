"use client";

import { Source, Layer } from "react-map-gl";
import type { HeatmapArea } from "@/types";

const HEAT_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

const HEAT_OPACITY: Record<number, number> = {
  1: 0.25,
  2: 0.30,
  3: 0.35,
  4: 0.40,
  5: 0.45,
};

interface HeatmapLayerProps {
  areas: HeatmapArea[];
  onAreaClick?: (area: HeatmapArea) => void;
}

export function HeatmapLayer({ areas }: HeatmapLayerProps) {
  if (!areas.length) return null;

  // Group by price level to render as separate GeoJSON layers
  const levels = [1, 2, 3, 4, 5] as const;

  return (
    <>
      {levels.map((level) => {
        const levelAreas = areas.filter((a) => a.priceLevel === level);
        if (!levelAreas.length) return null;

        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: levelAreas.map((area) => ({
            type: "Feature",
            id: area.id,
            properties: {
              id: area.id,
              name: area.name,
              district: area.district,
              avgPrice: area.avgPrice,
              pricePerM2: area.pricePerM2,
              priceLevel: area.priceLevel,
            },
            geometry: {
              type: "Polygon",
              coordinates: [area.boundary],
            },
          })),
        };

        return (
          <Source
            key={`heatmap-source-${level}`}
            id={`heatmap-source-${level}`}
            type="geojson"
            data={geojson}
          >
            {/* Fill layer */}
            <Layer
              id={`heatmap-fill-${level}`}
              type="fill"
              paint={{
                "fill-color": HEAT_COLORS[level],
                "fill-opacity": HEAT_OPACITY[level],
              }}
            />
            {/* Outline layer */}
            <Layer
              id={`heatmap-outline-${level}`}
              type="line"
              paint={{
                "line-color": HEAT_COLORS[level],
                "line-width": 1,
                "line-opacity": 0.6,
              }}
            />
          </Source>
        );
      })}
    </>
  );
}
