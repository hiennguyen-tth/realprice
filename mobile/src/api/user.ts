import apiClient from './client';
import type {ApiResponse, Listing, PaginatedResponse, User} from '../types';

export async function getMe(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/users/me');
  return response.data.data;
}

export async function updateMe(input: Partial<User>): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>(
    '/users/me',
    input,
  );
  return response.data.data;
}

export async function getSavedListings(
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<Listing>> {
  const response = await apiClient.get<PaginatedResponse<Listing>>(
    '/users/me/saved-listings',
    {params: {page, pageSize}},
  );
  return response.data;
}

export async function saveListing(listingId: string): Promise<void> {
  await apiClient.post(`/users/me/saved-listings/${listingId}`);
}

export async function unsaveListing(listingId: string): Promise<void> {
  await apiClient.delete(`/users/me/saved-listings/${listingId}`);
}

export async function getMyListings(
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<Listing>> {
  const response = await apiClient.get<PaginatedResponse<Listing>>(
    '/users/me/listings',
    {params: {page, pageSize}},
  );
  return response.data;
}
