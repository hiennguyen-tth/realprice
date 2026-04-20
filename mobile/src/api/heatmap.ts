import apiClient from './client';
import type {ApiResponse, AreaPriceIndex, BBox, HeatmapArea} from '../types';

export async function getHeatmap(
  bbox: BBox,
  zoom: number,
): Promise<HeatmapArea[]> {
  const response = await apiClient.get<ApiResponse<HeatmapArea[]>>(
    '/heatmap',
    {
      params: {
        west: bbox.west,
        south: bbox.south,
        east: bbox.east,
        north: bbox.north,
        zoom,
      },
    },
  );
  return response.data.data;
}

export async function getDistrictStats(
  city: string,
): Promise<AreaPriceIndex[]> {
  const response = await apiClient.get<ApiResponse<AreaPriceIndex[]>>(
    '/heatmap/districts',
    {params: {city}},
  );
  return response.data.data;
}

export async function getWardStats(district: string): Promise<AreaPriceIndex[]> {
  const response = await apiClient.get<ApiResponse<AreaPriceIndex[]>>(
    '/heatmap/wards',
    {params: {district}},
  );
  return response.data.data;
}
