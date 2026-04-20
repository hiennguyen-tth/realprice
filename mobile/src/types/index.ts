// ─── Core Domain Types ───────────────────────────────────────────────────────

export type LegalStatus =
  | 'so_do'
  | 'so_hong'
  | 'hop_dong'
  | 'giay_to_khac'
  | 'chua_co';

export type ListingType = 'ban' | 'cho_thue';

export type LandType =
  | 'dat_o'
  | 'dat_vuon'
  | 'dat_nong_nghiep'
  | 'dat_thuong_mai'
  | 'dat_nen_du_an'
  | 'nha_pho'
  | 'biet_thu'
  | 'chung_cu'
  | 'nha_tro';

export type ListingStatus = 'active' | 'pending' | 'sold' | 'expired' | 'draft';

export type MapMode = 'marker' | 'heatmap';

export type HeatLevel = 1 | 2 | 3 | 4 | 5;

export type UserPlan = 'free' | 'pro' | 'enterprise';

// ─── Land / Parcel ───────────────────────────────────────────────────────────

export interface LandCoordinates {
  latitude: number;
  longitude: number;
}

export interface Land {
  id: string;
  parcelCode: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  coordinates: LandCoordinates;
  area: number; // m²
  legalStatus: LegalStatus;
  landType: LandType;
  minPricePerM2: number; // VND
  maxPricePerM2: number; // VND
  avgPricePerM2: number; // VND
  totalListings: number;
  activeListings: number;
  hasBoosted: boolean;
  lastUpdated: string; // ISO date
  polygon?: LandCoordinates[];
}

export interface LandMarker {
  id: string;
  coordinates: LandCoordinates;
  minPrice: number;
  avgPricePerM2: number;
  totalListings: number;
  hasBoosted: boolean;
}

// ─── Listing ─────────────────────────────────────────────────────────────────

export interface ListingImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
}

export interface SellerInfo {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  plan: UserPlan;
}

export interface Listing {
  id: string;
  landId: string;
  title: string;
  description: string;
  listingType: ListingType;
  landType: LandType;
  area: number; // m²
  price: number; // VND total
  pricePerM2: number; // VND/m²
  frontage?: number; // m
  alleyWidth?: number; // m
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  legalStatus: LegalStatus;
  status: ListingStatus;
  images: ListingImage[];
  address: string;
  ward: string;
  district: string;
  city: string;
  coordinates: LandCoordinates;
  seller: SellerInfo;
  isBoosted: boolean;
  score?: number;
  viewCount: number;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface CreateListingInput {
  landId?: string;
  title: string;
  description: string;
  listingType: ListingType;
  landType: LandType;
  area: number;
  price: number;
  frontage?: number;
  alleyWidth?: number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  legalStatus: LegalStatus;
  address: string;
  ward: string;
  district: string;
  city: string;
  coordinates: LandCoordinates;
  imageIds: string[];
  contactPhone: string;
  isBoosted?: boolean;
}

// ─── Price Data ───────────────────────────────────────────────────────────────

export interface PriceHistoryPoint {
  month: string; // "2024-01"
  avgPricePerM2: number;
  minPrice: number;
  maxPrice: number;
  totalTransactions: number;
}

export interface AreaPriceIndex {
  areaId: string;
  areaName: string;
  areaType: 'ward' | 'district' | 'city';
  avgPricePerM2: number;
  priceChange1m: number; // percentage
  priceChange3m: number;
  priceChange12m: number;
  heatLevel: HeatLevel;
  totalListings: number;
  coordinates: LandCoordinates[];
  centerCoordinates: LandCoordinates;
}

export interface HeatmapArea extends AreaPriceIndex {
  geoJson: GeoJsonPolygon;
}

export interface GeoJsonPolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    areaId: string;
    areaName: string;
    heatLevel: HeatLevel;
    avgPricePerM2: number;
    totalListings: number;
  };
}

// ─── Bank Valuation ───────────────────────────────────────────────────────────

export interface BankValuation {
  bankId: string;
  bankName: string;
  bankLogo?: string;
  valuationPerM2: number; // VND/m²
  totalValuation: number; // VND
  ltv: number; // loan-to-value ratio 0-1
  maxLoanAmount: number; // VND
  interestRate: number; // annual %
  vsMarketPercent: number; // difference vs market price %
  valuationDate: string; // ISO date
}

export interface BankValuationResponse {
  landId: string;
  marketPricePerM2: number;
  area: number;
  valuations: BankValuation[];
}

// ─── Price Comparison ─────────────────────────────────────────────────────────

export interface PriceComparison {
  id: string;
  items: Listing[];
  analysis: ComparisonAnalysis;
  createdAt: string;
}

export interface ComparisonAnalysis {
  cheapestId: string;
  bestValueId: string;
  recommendation: string;
  scores: Record<string, number>;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  plan: UserPlan;
  isVerified: boolean;
  listingQuota: {
    used: number;
    total: number;
  };
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix timestamp
}

// ─── Lead / Contact ───────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  listingId: string;
  buyerPhone: string;
  buyerName?: string;
  message?: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'closed';
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Map / Geo ────────────────────────────────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
  zoom: number;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileId: string;
  publicUrl: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ListingFilters {
  listingType?: ListingType;
  landType?: LandType;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  legalStatus?: LegalStatus;
  district?: string;
  ward?: string;
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'area_asc' | 'area_desc';
}
