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
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
    const minPricePerM2 = Number((land as any).min_price_per_m2 ?? (land as any).minPricePerM2 ?? land.pricePerM2);
    const totalListings = Number((land as any).total_listings ?? land.totalListings);

    return {
      id: land.id,
      address: land.address,
      district: land.district,
      pricePerM2: Number.isFinite(minPricePerM2) ? minPricePerM2 : 0,
      totalListings: Number.isFinite(totalListings) ? totalListings : 0,
      location: {
        longitude:
          typeof (land as any).lng === "number"
            ? (land as any).lng
            : Number((land as any).lng) || 0,
        latitude:
          typeof (land as any).lat === "number"
            ? (land as any).lat
            : Number((land as any).lat) || 0,
      },
    };
  });
}

export async function getLandById(id: string): Promise<Land> {
  const { data } = await apiClient.get<ApiResponse<Land>>(`/lands/${id}`);
  return data.data;
}

export async function getLandBySlug(
  district: string,
  street: string
): Promise<Land> {
  const { data } = await apiClient.get<ApiResponse<Land>>(
    `/lands/slug/${encodeURIComponent(district)}/${encodeURIComponent(street)}`
  );
  return data.data;
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
  const { data } = await apiClient.get<PaginatedResponse<Listing>>(
    "/listings",
    {
      params: { landId, page, limit, ...filters },
    }
  );
  return data;
}

export async function getListingById(id: string): Promise<Listing> {
  const { data } = await apiClient.get<ApiResponse<Listing>>(
    `/listings/${id}`
  );
  return data.data;
}

export async function createListing(
  payload: CreateListingPayload
): Promise<Listing> {
  const { data } = await apiClient.post<ApiResponse<Listing>>(
    "/listings",
    payload
  );
  return data.data;
}

export async function updateListing(
  id: string,
  payload: Partial<CreateListingPayload>
): Promise<Listing> {
  const { data } = await apiClient.put<ApiResponse<Listing>>(
    `/listings/${id}`,
    payload
  );
  return data.data;
}

export async function deleteListing(id: string): Promise<void> {
  await apiClient.delete(`/listings/${id}`);
}

export async function getPresignedUrl(
  fileName: string,
  contentType: string
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post<ApiResponse<PresignedUrlResponse>>(
    "/listings/presigned-url",
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
    data: data.listings,
    pagination: data.pagination,
  };
}

export async function getMyListings(): Promise<Listing[]> {
  const { data } = await apiClient.get<ApiResponse<Listing[]>>("/listings/me");
  return data.data;
}

export async function getSavedListings(): Promise<Listing[]> {
  const { data } =
    await apiClient.get<ApiResponse<Listing[]>>("/listings/saved");
  return data.data;
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
// Heatmap API
// ─────────────────────────────────────────────────────────────────────────────

export async function getHeatmap(bbox: BoundingBox): Promise<HeatmapArea[]> {
  const { data } = await apiClient.get<ApiResponse<HeatmapArea[]>>(
    "/heatmap",
    { params: { bbox: bboxParam(bbox) } }
  );
  return data.data;
}

export async function getDistrictHeatmap(
  district: string
): Promise<HeatmapArea[]> {
  const { data } = await apiClient.get<ApiResponse<HeatmapArea[]>>(
    `/heatmap/district/${encodeURIComponent(district)}`
  );
  return data.data;
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
  return data.data;
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
// Leads API
// ─────────────────────────────────────────────────────────────────────────────

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const { data } = await apiClient.post<ApiResponse<Lead>>("/leads", payload);
  return data.data;
}
