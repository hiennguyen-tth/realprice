import {useState, useCallback, useRef} from 'react';
import {getLandsByBbox} from '../api/lands';
import {getHeatmap} from '../api/heatmap';
import {regionToBbox, bboxToCacheKey} from '../utils/geoUtils';
import type {HeatmapArea, LandMarker, MapMode, MapRegion} from '../types';

// Module-level cache persists for the lifetime of the app session
const LOADED_REGIONS = new Map<string, LandMarker[]>();

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

interface UseMapDataReturn {
  markers: LandMarker[];
  heatAreas: HeatmapArea[];
  loading: boolean;
  error: string | null;
  fetchData: (region: MapRegion) => void;
  clearCache: () => void;
}

export function useMapData(mode: MapMode): UseMapDataReturn {
  const [markers, setMarkers] = useState<LandMarker[]>([]);
  const [heatAreas, setHeatAreas] = useState<HeatmapArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep fetchData stable so it can be used in useEffect
  const modeRef = useRef<MapMode>(mode);
  modeRef.current = mode;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(
    debounce(async (region: MapRegion) => {
      const currentMode = modeRef.current;
      const bbox = regionToBbox(region);
      setError(null);

      try {
        if (currentMode === 'marker') {
          const cacheKey = bboxToCacheKey(bbox, region.zoom);

          if (LOADED_REGIONS.has(cacheKey)) {
            setMarkers(LOADED_REGIONS.get(cacheKey)!);
            return;
          }

          setLoading(true);
          const data = await getLandsByBbox(bbox, region.zoom);
          LOADED_REGIONS.set(cacheKey, data);
          setMarkers(data);
        } else {
          setLoading(true);
          const data = await getHeatmap(bbox, region.zoom);
          setHeatAreas(data);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể tải dữ liệu bản đồ.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  const clearCache = useCallback(() => {
    LOADED_REGIONS.clear();
  }, []);

  return {markers, heatAreas, loading, error, fetchData, clearCache};
}
