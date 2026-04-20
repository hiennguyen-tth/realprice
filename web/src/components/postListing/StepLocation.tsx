"use client";

import { useState, useRef, useCallback } from "react";
import Map, { Marker, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PostListingFormData } from "@/hooks/usePostListing";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface StepLocationProps {
  formData: PostListingFormData;
  updateForm: (updates: Partial<PostListingFormData>) => void;
  onNext: () => void;
}

export function StepLocation({ formData, updateForm, onNext }: StepLocationProps) {
  const mapRef = useRef<MapRef>(null);
  const [markerPos, setMarkerPos] = useState(
    formData.location ?? { longitude: 106.6297, latitude: 10.8231 }
  );
  const [viewport, setViewport] = useState({
    longitude: formData.location?.longitude ?? 106.6297,
    latitude: formData.location?.latitude ?? 10.8231,
    zoom: 14,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMarkerDrag = useCallback((evt: { lngLat: { lng: number; lat: number } }) => {
    setMarkerPos({ longitude: evt.lngLat.lng, latitude: evt.lngLat.lat });
    updateForm({ location: { longitude: evt.lngLat.lng, latitude: evt.lngLat.lat } });
  }, [updateForm]);

  const handleMapClick = useCallback((evt: { lngLat: { lng: number; lat: number } }) => {
    setMarkerPos({ longitude: evt.lngLat.lng, latitude: evt.lngLat.lat });
    updateForm({ location: { longitude: evt.lngLat.lng, latitude: evt.lngLat.lat } });
  }, [updateForm]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.address.trim()) errs.address = "Vui lòng nhập địa chỉ";
    if (!formData.district.trim()) errs.district = "Vui lòng nhập quận/huyện";
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    updateForm({ location: markerPos });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Vị trí bất động sản</h2>
        <p className="text-sm text-gray-500 mt-1">
          Nhập địa chỉ và kéo điểm đánh dấu trên bản đồ để xác định vị trí chính xác.
        </p>
      </div>

      {/* Address inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Địa chỉ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateForm({ address: e.target.value })}
            placeholder="Số nhà, tên đường..."
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => updateForm({ district: e.target.value })}
            placeholder="Quận 1, Hoàn Kiếm..."
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
        </div>
      </div>

      {/* Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Xác nhận vị trí trên bản đồ
        </label>
        <p className="text-xs text-gray-500 mb-2">Kéo điểm đánh dấu hoặc nhấp vào bản đồ để điều chỉnh vị trí chính xác.</p>
        <div className="rounded-2xl overflow-hidden border border-border h-72">
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            longitude={viewport.longitude}
            latitude={viewport.latitude}
            zoom={viewport.zoom}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            onMove={(evt) =>
              setViewport({
                longitude: evt.viewState.longitude,
                latitude: evt.viewState.latitude,
                zoom: evt.viewState.zoom,
              })
            }
            onClick={handleMapClick}
            cursor="crosshair"
          >
            <Marker
              longitude={markerPos.longitude}
              latitude={markerPos.latitude}
              draggable
              onDragEnd={handleMarkerDrag}
              anchor="bottom"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-primary rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div
                  className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary"
                />
              </div>
            </Marker>
          </Map>
        </div>
        {markerPos && (
          <p className="text-xs text-gray-400 mt-1">
            Tọa độ: {markerPos.latitude.toFixed(5)}, {markerPos.longitude.toFixed(5)}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
