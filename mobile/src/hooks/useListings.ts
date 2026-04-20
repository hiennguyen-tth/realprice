import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {getListingsByLandId, getListings, getListingById} from '../api/listings';
import type {ListingFilters} from '../types';

export const listingKeys = {
  all: ['listings'] as const,
  byLand: (landId: string) => ['listings', 'land', landId] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
  list: (filters: ListingFilters) => ['listings', 'list', filters] as const,
};

/**
 * Hook to fetch listings for a specific land parcel.
 */
export function useListingsByLand(
  landId: string | null,
  filters: Partial<ListingFilters> = {},
) {
  return useQuery({
    queryKey: listingKeys.byLand(landId ?? ''),
    queryFn: () => getListingsByLandId(landId!, filters),
    enabled: !!landId,
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Hook to fetch a single listing by ID.
 */
export function useListingDetail(listingId: string | null) {
  return useQuery({
    queryKey: listingKeys.detail(listingId ?? ''),
    queryFn: () => getListingById(listingId!),
    enabled: !!listingId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Infinite query hook for paginated listing search.
 */
export function useListingsInfinite(filters: ListingFilters = {}) {
  return useInfiniteQuery({
    queryKey: listingKeys.list(filters),
    queryFn: ({pageParam}) =>
      getListings({...filters, page: pageParam as number, pageSize: 20}),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 3,
  });
}

/**
 * Simple paginated listing query.
 */
export function useListingsQuery(filters: ListingFilters = {}) {
  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: () => getListings(filters),
    staleTime: 1000 * 60 * 3,
  });
}
