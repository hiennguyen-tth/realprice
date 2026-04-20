import apiClient from './client';
import type {
  ApiResponse,
  BBox,
  BankValuationResponse,
  Land,
  LandMarker,
  PaginatedResponse,
  PriceHistoryPoint,
} from '../types';

export async function getLandsByBbox(
  bbox: BBox,
  zoom: number,
): Promise<LandMarker[]> {
  const response = await apiClient.get<ApiResponse<LandMarker[]>>(
    '/lands/bbox',
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

export async function getLandById(landId: string): Promise<Land> {
  const response = await apiClient.get<ApiResponse<Land>>(`/lands/${landId}`);
  return response.data.data;
}

export async function getPriceHistory(
  landId: string,
  months: number = 6,
): Promise<PriceHistoryPoint[]> {
  const response = await apiClient.get<ApiResponse<PriceHistoryPoint[]>>(
    `/lands/${landId}/price-history`,
    {params: {months}},
  );
  return response.data.data;
}

export async function getNearbyLands(
  landId: string,
  radiusMeters: number = 500,
  limit: number = 10,
): Promise<PaginatedResponse<Land>> {
  const response = await apiClient.get<PaginatedResponse<Land>>(
    `/lands/${landId}/nearby`,
    {params: {radius: radiusMeters, limit}},
  );
  return response.data;
}

export async function getBankValuationsForLand(
  landId: string,
): Promise<BankValuationResponse> {
  const response = await apiClient.get<ApiResponse<BankValuationResponse>>(
    `/lands/${landId}/bank-valuations`,
  );
  return response.data.data;
}
