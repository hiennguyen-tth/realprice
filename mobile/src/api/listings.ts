import apiClient from './client';
import type {
  ApiResponse,
  CreateListingInput,
  Listing,
  ListingFilters,
  PaginatedResponse,
  UploadUrlResponse,
} from '../types';

export async function getListings(
  filters: ListingFilters = {},
): Promise<PaginatedResponse<Listing>> {
  const response = await apiClient.get<PaginatedResponse<Listing>>(
    '/listings',
    {params: filters},
  );
  return response.data;
}

export async function getListingById(listingId: string): Promise<Listing> {
  const response = await apiClient.get<ApiResponse<Listing>>(
    `/listings/${listingId}`,
  );
  return response.data.data;
}

export async function getListingsByLandId(
  landId: string,
  filters: Partial<ListingFilters> = {},
): Promise<PaginatedResponse<Listing>> {
  const response = await apiClient.get<PaginatedResponse<Listing>>(
    `/lands/${landId}/listings`,
    {params: filters},
  );
  return response.data;
}

export async function createListing(
  input: CreateListingInput,
): Promise<Listing> {
  const response = await apiClient.post<ApiResponse<Listing>>(
    '/listings',
    input,
  );
  return response.data.data;
}

export async function updateListing(
  listingId: string,
  input: Partial<CreateListingInput>,
): Promise<Listing> {
  const response = await apiClient.patch<ApiResponse<Listing>>(
    `/listings/${listingId}`,
    input,
  );
  return response.data.data;
}

export async function deleteListing(listingId: string): Promise<void> {
  await apiClient.delete(`/listings/${listingId}`);
}

export async function boostListing(listingId: string): Promise<Listing> {
  const response = await apiClient.post<ApiResponse<Listing>>(
    `/listings/${listingId}/boost`,
  );
  return response.data.data;
}

export async function contactListing(
  listingId: string,
  message?: string,
): Promise<{success: boolean}> {
  const response = await apiClient.post<ApiResponse<{success: boolean}>>(
    `/listings/${listingId}/contact`,
    {message},
  );
  return response.data.data;
}

export async function getUploadUrl(
  fileName: string,
  mimeType: string,
): Promise<UploadUrlResponse> {
  const response = await apiClient.post<ApiResponse<UploadUrlResponse>>(
    '/listings/upload-url',
    {fileName, mimeType},
  );
  return response.data.data;
}

export async function getSimilarListings(
  listingId: string,
  limit: number = 5,
): Promise<Listing[]> {
  const response = await apiClient.get<ApiResponse<Listing[]>>(
    `/listings/${listingId}/similar`,
    {params: {limit}},
  );
  return response.data.data;
}
