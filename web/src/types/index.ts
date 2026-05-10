// ─────────────────────────────────────────────────────────────────────────────
// Core geographic / spatial types
// ─────────────────────────────────────────────────────────────────────────────

export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Land types
// ─────────────────────────────────────────────────────────────────────────────

export type ListingType =
  | "dat_nen"
  | "nha_pho"
  | "chung_cu"
  | "biet_thu"
  | "van_phong";

export type ListingStatus = "active" | "sold" | "expired" | "pending";

export interface Land {
  id: string;
  address: string;
  district: string;
  city: string;
  street: string;
  location: GeoPoint;
  boundary?: number[][];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  pricePerM2: number;
  totalListings: number;
  createdAt: string;
  updatedAt: string;
}

export interface LandMarker {
  id: string;
  location: GeoPoint;
  pricePerM2: number;
  totalListings: number;
  address: string;
  district: string;
}

export interface AreaPriceIndex {
  district: string;
  city: string;
  avgPricePerM2: number;
  minPricePerM2: number;
  maxPricePerM2: number;
  totalListings: number;
  priceChange30d: number; // percentage
  priceChange90d: number; // percentage
  topStreets: StreetStat[];
}

export interface StreetStat {
  street: string;
  avgPricePerM2: number;
  totalListings: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing types
// ─────────────────────────────────────────────────────────────────────────────

export interface Listing {
  id: string;
  landId: string;
  userId?: string;
  title: string;
  description?: string;
  price: number;
  area: number; // m²
  pricePerM2: number;
  listingType: ListingType;
  status: ListingStatus;
  images: string[];
  address: string;
  district?: string;
  ward?: string;
  province?: string;
  location?: GeoPoint;
  contactName?: string;
  contactPhone?: string;
  score?: number;
  land?: Land;
  createdAt: string;
  updatedAt: string;
  sourceUrl?: string | null;
  source?: string | null;
}

export interface CreateListingPayload {
  landId?: string;
  title: string;
  description?: string;
  price: number;
  area: number;
  listingType: ListingType;
  address: string;
  location?: GeoPoint;
  contactName: string;
  contactPhone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Price history
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceHistoryPoint {
  date: string; // ISO date string
  avgPrice: number;
  pricePerM2: number;
  totalListings: number;
}

export interface PriceHistory {
  landId: string;
  points: PriceHistoryPoint[];
  changePercent30d: number;
  changePercent90d: number;
  changePercent180d: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bank valuation types
// ─────────────────────────────────────────────────────────────────────────────

export interface BankValuation {
  id: string;
  landId: string;
  bankName: string;
  bankCode: string;
  valuationPrice: number;
  ltvRatio: number; // percentage (e.g. 70 = 70%)
  maxLoan: number;
  interestRate?: number;
  valuationDate: string;
  notes?: string;
  vsMarketPercent: number; // valuation vs market avg (+/-)
}

export interface BankValuationSummary {
  avgValuation: number;
  maxLoan: number;
  highestLTV: number;
  banks: BankValuation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison types
// ─────────────────────────────────────────────────────────────────────────────

export interface ComparisonItem {
  listingId: string;
  listing: Listing;
}

export interface PriceComparison {
  id: string;
  items: ComparisonItem[];
  analysis: ComparisonAnalysis;
  createdAt: string;
}

export interface ComparisonAnalysis {
  cheapestListingId: string;
  cheapestListing: { id: string; title: string; price: number } | null;
  bestPerM2ListingId: string;
  bestPerM2Listing: { id: string; title: string; price_per_m2: number } | null;
  largestListingId: string | null;
  largestListing: { id: string; title: string; area_m2: string } | null;
  bestValueListingId: string;
  priceRange: { min: number; max: number };
  perM2Range: { min: number; max: number };
  recommendation: string;
  summary?: string;
  rankings: { listingId: string; score: number }[];
}

export interface CreateComparisonPayload {
  listingIds: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap types
// ─────────────────────────────────────────────────────────────────────────────

export interface HeatmapArea {
  id: string;
  name: string;
  district: string;
  boundary: number[][]; // polygon coordinates [lng, lat][]
  avgPrice: number;
  pricePerM2: number;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// User types
// ─────────────────────────────────────────────────────────────────────────────

export type UserPlan = "free" | "pro" | "enterprise";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  plan: UserPlan;
  createdAt: string;
}

export interface AuthUser extends User {
  token: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lead types
// ─────────────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  listingId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  createdAt: string;
}

export interface CreateLeadPayload {
  listingId: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API response wrappers
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Map types
// ─────────────────────────────────────────────────────────────────────────────

export type MapMode = "markers" | "heatmap";

export interface MapViewport {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter types
// ─────────────────────────────────────────────────────────────────────────────

export interface ListingFilters {
  listingType?: ListingType | "";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  district?: string;
  ward?: string;
  sortBy?: "price_asc" | "price_desc" | "area_asc" | "area_desc" | "newest";
}

// ─────────────────────────────────────────────────────────────────────────────
// Search types
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchResult {
  listings: Listing[];
  lands: Land[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Presigned URL
// ─────────────────────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  url: string;
  key: string;
  publicUrl: string;
}
