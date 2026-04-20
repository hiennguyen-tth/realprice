import {create} from 'zustand';
import type {LandType, LegalStatus, ListingType} from '../types';

interface FilterState {
  listingType: ListingType | undefined;
  landType: LandType | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minArea: number | undefined;
  maxArea: number | undefined;
  legalStatus: LegalStatus | undefined;
  district: string | undefined;
  ward: string | undefined;
  query: string;
  sortBy:
    | 'price_asc'
    | 'price_desc'
    | 'newest'
    | 'area_asc'
    | 'area_desc'
    | undefined;
}

interface FilterActions {
  setListingType: (type: ListingType | undefined) => void;
  setLandType: (type: LandType | undefined) => void;
  setPriceRange: (min: number | undefined, max: number | undefined) => void;
  setAreaRange: (min: number | undefined, max: number | undefined) => void;
  setLegalStatus: (status: LegalStatus | undefined) => void;
  setDistrict: (district: string | undefined) => void;
  setWard: (ward: string | undefined) => void;
  setQuery: (query: string) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  reset: () => void;
  hasActiveFilters: () => boolean;
}

type FilterStore = FilterState & FilterActions;

const DEFAULT_STATE: FilterState = {
  listingType: undefined,
  landType: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minArea: undefined,
  maxArea: undefined,
  legalStatus: undefined,
  district: undefined,
  ward: undefined,
  query: '',
  sortBy: 'newest',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...DEFAULT_STATE,

  setListingType: type => set({listingType: type}),

  setLandType: type => set({landType: type}),

  setPriceRange: (min, max) => set({minPrice: min, maxPrice: max}),

  setAreaRange: (min, max) => set({minArea: min, maxArea: max}),

  setLegalStatus: status => set({legalStatus: status}),

  setDistrict: district => set({district, ward: undefined}),

  setWard: ward => set({ward}),

  setQuery: query => set({query}),

  setSortBy: sortBy => set({sortBy}),

  reset: () => set(DEFAULT_STATE),

  hasActiveFilters: () => {
    const s = get();
    return (
      s.listingType !== undefined ||
      s.landType !== undefined ||
      s.minPrice !== undefined ||
      s.maxPrice !== undefined ||
      s.minArea !== undefined ||
      s.maxArea !== undefined ||
      s.legalStatus !== undefined ||
      s.district !== undefined ||
      s.query !== ''
    );
  },
}));
