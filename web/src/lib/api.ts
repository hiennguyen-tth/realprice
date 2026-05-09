import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type {
  Land,
  LandMarker,
  Listing,
  CreateListingPayload,
  PriceHistory,
  BankValuation,
  BankValuationSummary,
  PriceComparison,
  CreateComparisonPayload,
  HeatmapArea,
  AreaPriceIndex,
  ApiResponse,
  PaginatedResponse,
  Lead,
  CreateLeadPayload,
  User,
  PresignedUrlResponse,
  ListingFilters,
  BoundingBox,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL
  ?? (typeof window !== 'undefined' ? '/api/v1' : 'http://localhost:4000/api/v1');

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// JWT request interceptor
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("realprice_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response error interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("realprice_token");
        window.dispatchEvent(new Event("realprice:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: normalize snake_case listing row → camelCase Listing
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListing(row: any): Listing {
  const images = (() => {
    if (Array.isArray(row.images)) return row.images as string[];
    if (typeof row.images === "string") {
      try { return JSON.parse(row.images) as string[]; } catch { return []; }
    }
    return [];
  })();

  const price = Number(row.price ?? 0);
  const area = Number(row.area ?? 0);
  const rawPpm = row.price_per_m2 ?? row.pricePerM2;
  const pricePerM2 = rawPpm != null
    ? Number(rawPpm)
    : area > 0 ? Math.round(price / area) : 0;

  return {
    id: row.id,
    landId: row.land_id ?? row.landId ?? "",
    userId: row.seller_id ?? row.userId,
    title: row.title ?? "",
    description: row.description,
    price,
    area,
    pricePerM2,
    listingType: (row.listing_type ?? row.listingType ?? "sale") as Listing["listingType"],
    status: (row.status ?? "active") as Listing["status"],
    images,
    address: row.address ?? row.land_address ?? "",
    district: row.district ?? row.land_district ?? "",
    ward: row.ward ?? row.land_ward ?? "",
    province: row.province ?? "",
    location: row.lat != null && row.lng != null
      ? { latitude: Number(row.lat), longitude: Number(row.lng) }
      : row.location,
    contactName: row.contact_name ?? row.contactName,
    contactPhone: row.contact_phone ?? row.contactPhone,
    score: row.score,
    land: row.land,
    createdAt: row.created_at ?? row.createdAt ?? "",
    updatedAt: row.updated_at ?? row.updatedAt ?? "",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build bbox query string
// ─────────────────────────────────────────────────────────────────────────────

function bboxParam(bbox: BoundingBox): string {
  return `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Land API
// ─────────────────────────────────────────────────────────────────────────────

export async function getLandsByBbox(
  bbox: BoundingBox
): Promise<LandMarker[]> {
  const { data } = await apiClient.get<ApiResponse<LandMarker[]>>("/lands", {
    params: { bbox: bboxParam(bbox) },
  });

  return data.data.map((land) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = land as any;
    const minPricePerM2 = Number(row.min_price_per_m2 ?? row.minPricePerM2 ?? row.pricePerM2 ?? 0);
    const totalListings = Number(row.total_listings ?? row.totalListings ?? 0);

    return {
      id: row.id,
      address: row.address,
      district: row.district,
      pricePerM2: Number.isFinite(minPricePerM2) ? minPricePerM2 : 0,
      totalListings: Number.isFinite(totalListings) ? totalListings : 0,
      location: {
        longitude: Number(row.lng ?? row.location?.longitude ?? 0),
        latitude: Number(row.lat ?? row.location?.latitude ?? 0),
      },
    };
  });
}

export async function getLandById(id: string): Promise<Land> {
  const { data } = await apiClient.get<ApiResponse<Land>>(`/lands/${id}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data.data as any;
  return {
    ...d,
    minPrice: Number(d.min_price ?? d.minPrice ?? 0),
    maxPrice: Number(d.max_price ?? d.maxPrice ?? 0),
    avgPrice: Number(d.avg_price ?? d.avgPrice ?? 0),
    pricePerM2: Number(d.price_per_m2 ?? d.pricePerM2 ?? 0),
    totalListings: Number(d.total_listings ?? d.totalListings ?? 0),
    slugDistrict: d.slug_district ?? d.slugDistrict ?? "",
    slugStreet: d.slug_street ?? d.slugStreet ?? "",
    location: {
      longitude: Number(d.lng ?? d.location?.longitude ?? 0),
      latitude: Number(d.lat ?? d.location?.latitude ?? 0),
    },
  } as Land;
}

export async function getLandBySlug(
  district: string,
  street: string
): Promise<Land> {
  const { data } = await apiClient.get<ApiResponse<Land>>(
    `/lands/slug/${encodeURIComponent(district)}/${encodeURIComponent(street)}`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data.data as any;
  return {
    ...d,
    location: {
      longitude: Number(d.lng_coord ?? d.lng ?? d.location?.longitude ?? 0),
      latitude: Number(d.lat_coord ?? d.lat ?? d.location?.latitude ?? 0),
    },
  } as Land;
}

export async function getPriceHistory(landId: string): Promise<PriceHistory> {
  const { data } = await apiClient.get<ApiResponse<PriceHistory>>(
    `/lands/${landId}/price-history`
  );
  return data.data;
}

export async function getBankValuationsForLand(
  landId: string
): Promise<BankValuationSummary> {
  const { data } = await apiClient.get<ApiResponse<BankValuationSummary>>(
    `/lands/${landId}/bank-valuations`
  );
  return data.data;
}

export async function getDistrictOverview(
  district: string
): Promise<AreaPriceIndex> {
  const { data } = await apiClient.get<ApiResponse<AreaPriceIndex>>(
    `/lands/district/${encodeURIComponent(district)}`
  );
  return data.data;
}

export async function getDistrictSummaries(
  limit = 30
): Promise<Array<{ district: string; province: string; slug: string; avgPricePerM2: number; minPricePerM2: number; maxPricePerM2: number; totalListings: number }>> {
  const { data } = await apiClient.get<ApiResponse<Array<{
    district: string;
    province: string;
    slug: string;
    avg_price_per_m2: number;
    min_price_per_m2: number;
    max_price_per_m2: number;
    total_listings: number;
  }>>>(`/lands/districts`, { params: { limit } });
  return (data.data ?? []).map((row) => ({
    district: row.district,
    province: row.province,
    slug: row.slug,
    avgPricePerM2: Number(row.avg_price_per_m2 ?? 0),
    minPricePerM2: Number(row.min_price_per_m2 ?? 0),
    maxPricePerM2: Number(row.max_price_per_m2 ?? 0),
    totalListings: Number(row.total_listings ?? 0),
  }));
}

export async function getNearbyLands(
  landId: string,
  radius = 1000
): Promise<Land[]> {
  const { data } = await apiClient.get<ApiResponse<Land[]>>(
    `/lands/${landId}/nearby`,
    { params: { radius } }
  );
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listings API
// ─────────────────────────────────────────────────────────────────────────────

export async function getListings(
  landId: string,
  page = 1,
  limit = 10,
  filters?: ListingFilters
): Promise<PaginatedResponse<Listing>> {
  const { data } = await apiClient.get<{
    success: boolean;
    listings?: Listing[];
    data?: Listing[];
    pagination: PaginatedResponse<Listing>["pagination"];
  }>("/listings", {
    params: { landId: landId || undefined, page, limit, ...filters },
  });

  // Backend returns `listings` key, not `data`
  const rows = data.listings ?? data.data ?? [];
  return {
    success: data.success,
    data: rows.map(normalizeListing),
    pagination: data.pagination ?? {
      page, limit, total: rows.length, totalPages: 1, hasNext: false, hasPrev: false,
    },
  };
}

export async function getListingById(id: string): Promise<Listing> {
  const { data } = await apiClient.get<ApiResponse<Listing>>(
    `/listings/${id}`
  );
  return normalizeListing(data.data);
}

export async function createListing(
  payload: CreateListingPayload
): Promise<Listing> {
  // Map camelCase → snake_case for the backend schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    title: payload.title,
    description: payload.description,
    price: payload.price,
    area: payload.area,
    address: payload.address,
    listing_type: (payload as any).listingType ?? (payload as any).listing_type ?? "sale",
    contact_name: (payload as any).contactName ?? (payload as any).contact_name,
    contact_phone: (payload as any).contactPhone ?? (payload as any).contact_phone,
    images: (payload as any).images ?? [],
  };

  // Extract lat/lng from GeoPoint location
  if (payload.location) {
    body.lat = payload.location.latitude;
    body.lng = payload.location.longitude;
  } else if ((payload as any).lat != null) {
    body.lat = (payload as any).lat;
    body.lng = (payload as any).lng;
  }

  // Optional land fields
  if ((payload as any).district) body.district = (payload as any).district;
  if ((payload as any).ward) body.ward = (payload as any).ward;

  const { data } = await apiClient.post<ApiResponse<Listing>>("/listings", body);
  return normalizeListing(data.data);
}

export async function updateListing(
  id: string,
  payload: Partial<CreateListingPayload>
): Promise<Listing> {
  const { data } = await apiClient.put<ApiResponse<Listing>>(
    `/listings/${id}`,
    payload
  );
  return normalizeListing(data.data);
}

export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

export async function getPresignedUrl(
  fileName: string,
  contentType: string
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post<ApiResponse<PresignedUrlResponse>>(
    "/listings/upload-url",
    { fileName, contentType }
  );
  return data.data;
}

export async function searchListings(
  query: string,
  filters?: ListingFilters,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<Listing>> {
  const { data } = await apiClient.get<{
    success: boolean;
    query: string;
    lands?: Land[];
    listings: Listing[];
    pagination: PaginatedResponse<Listing>["pagination"];
  }>("/search", {
    params: { q: query, page, limit, ...filters },
  });

  return {
    success: data.success,
    data: (data.listings ?? []).map(normalizeListing),
    pagination: data.pagination ?? {
      page, limit, total: 0, totalPages: 1, hasNext: false, hasPrev: false,
    },
  };
}

export async function getMyListings(): Promise<Listing[]> {
  const { data } = await apiClient.get<ApiResponse<Listing[]>>("/listings/me");
  return (data.data ?? []).map(normalizeListing);
}

export async function getSavedListings(): Promise<Listing[]> {
  // Saved listings feature not yet implemented in backend — return empty
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison API
// ─────────────────────────────────────────────────────────────────────────────

export async function createComparison(
  payload: CreateComparisonPayload
): Promise<PriceComparison> {
  const { data } = await apiClient.post<ApiResponse<PriceComparison>>(
    "/comparison",
    payload
  );
  return data.data;
}

export async function getComparison(id: string): Promise<PriceComparison> {
  const { data } = await apiClient.get<ApiResponse<PriceComparison>>(
    `/comparison/${id}`
  );
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat API
// ─────────────────────────────────────────────────────────────────────────────

export async function chatWithAI(
  message: string,
  context?: Record<string, unknown>
): Promise<{ response: string; action?: Record<string, unknown> }> {
  const { data } = await apiClient.post<{
    success: boolean;
    data: { response: string; action?: Record<string, unknown> };
  }>("/chat", {
    message,
    context: context || {},
  });
  return data.data;
}

export async function parseSearchFilters(message: string): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<{
    success: boolean;
    data: Record<string, unknown>;
  }>("/chat/search", { message });
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap API
// ─────────────────────────────────────────────────────────────────────────────

export async function getHeatmap(bbox: BoundingBox, zoom?: number): Promise<HeatmapArea[]> {
  const params: Record<string, string | number> = { bbox: bboxParam(bbox) };
  if (zoom != null) params.zoom = zoom;
  const { data } = await apiClient.get<ApiResponse<any[]>>("/heatmap", { params });
  return (data.data ?? []).map((d: any) => ({
    id: d.id,
    name: d.name || d.district || d.ward || '',
    district: d.district || '',
    boundary: d.boundary_geojson?.coordinates?.[0] ?? [],
    avgPrice: Number(d.avg_price ?? 0),
    pricePerM2: Number(d.avg_price_per_m2 ?? 0),
    priceLevel: Number(d.heat_level ?? d.price_level ?? 3) as 1 | 2 | 3 | 4 | 5,
    updatedAt: d.updated_at ?? '',
  }));
}

export async function getDistrictHeatmap(
  district: string
): Promise<HeatmapArea[]> {
  const { data } = await apiClient.get<ApiResponse<HeatmapArea[]>>(
    `/heatmap/district/${encodeURIComponent(district)}`
  );
  return data.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Bank Valuation API
// ─────────────────────────────────────────────────────────────────────────────

export async function getBankValuations(
  district: string
): Promise<BankValuation[]> {
  const { data } = await apiClient.get<ApiResponse<BankValuation[]>>(
    "/bank-valuations",
    { params: { district } }
  );
  return data.data ?? [];
}

export async function getBankValuationById(
  id: string
): Promise<BankValuation> {
  const { data } = await apiClient.get<ApiResponse<BankValuation>>(
    `/bank-valuations/${id}`
  );
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────

export async function loginApi(
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const { data } = await apiClient.post<
    ApiResponse<{ user: User; token: string }>
  >("/auth/login", { email, password });
  return data.data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const { data } = await apiClient.post<
    ApiResponse<{ user: User; token: string }>
  >("/auth/register", { name, email, password });
  return data.data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
  return data.data;
}

export async function updateMe(
  payload: Partial<Pick<User, "name" | "phone" | "avatar">>
): Promise<User> {
  const { data } = await apiClient.put<ApiResponse<User>>(
    "/auth/me",
    payload
  );
  return data.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leads API — POST /listings/:id/contact
// ─────────────────────────────────────────────────────────────────────────────

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const { listingId, ...body } = payload;
  const { data } = await apiClient.post<ApiResponse<Lead>>(
    `/listings/${listingId}/contact`,
    body
  );
  return data.data;
}
