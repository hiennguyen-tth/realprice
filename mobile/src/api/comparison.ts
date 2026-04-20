import apiClient from './client';
import type {ApiResponse, PriceComparison} from '../types';

export async function createComparison(
  listingIds: string[],
): Promise<PriceComparison> {
  const response = await apiClient.post<ApiResponse<PriceComparison>>(
    '/comparisons',
    {listingIds},
  );
  return response.data.data;
}

export async function getComparison(
  comparisonId: string,
): Promise<PriceComparison> {
  const response = await apiClient.get<ApiResponse<PriceComparison>>(
    `/comparisons/${comparisonId}`,
  );
  return response.data.data;
}

export async function addToComparison(
  comparisonId: string,
  listingId: string,
): Promise<PriceComparison> {
  const response = await apiClient.post<ApiResponse<PriceComparison>>(
    `/comparisons/${comparisonId}/items`,
    {listingId},
  );
  return response.data.data;
}

export async function removeFromComparison(
  comparisonId: string,
  listingId: string,
): Promise<PriceComparison> {
  const response = await apiClient.delete<ApiResponse<PriceComparison>>(
    `/comparisons/${comparisonId}/items/${listingId}`,
  );
  return response.data.data;
}
