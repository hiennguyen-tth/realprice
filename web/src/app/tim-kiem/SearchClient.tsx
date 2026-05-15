"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchListings } from "@/lib/api";
import { useFilterStore } from "@/store/filterStore";
import { ListingCard } from "@/components/listing/ListingCard";
import { CompareTray } from "@/components/comparison/CompareTray";
import { ListingCardSkeleton } from "@/components/common/Skeleton";
import type { Listing, ListingType, PaginatedResponse } from "@/types";
import { clsx } from "clsx";

const LISTING_TYPES: Array<{ value: ListingType | ""; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "dat_nen", label: "Đất nền" },
  { value: "nha_pho", label: "Nhà phố" },
  { value: "chung_cu", label: "Chung cư" },
  { value: "biet_thu", label: "Biệt thự" },
  { value: "van_phong", label: "Văn phòng" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "area_asc", label: "Diện tích tăng dần" },
  { value: "area_desc", label: "Diện tích giảm dần" },
] as const;

const PAGE_SIZE = 20;

interface SearchClientProps {
  initialQuery: string;
  initialResults: PaginatedResponse<Listing> | null;
}

function SearchContent({ initialQuery: serverInitialQuery, initialResults }: SearchClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? serverInitialQuery;
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [page, setPage] = useState(1);

  const {
    listingType, setListingType,
    minPrice, maxPrice, setMinPrice, setMaxPrice,
    minArea, maxArea, setMinArea, setMaxArea,
    sortBy, setSortBy,
  } = useFilterStore();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search", initialQuery, listingType, minPrice, maxPrice, minArea, maxArea, sortBy, page],
    queryFn: () =>
      searchListings(
        initialQuery,
        { listingType: listingType || undefined, minPrice, maxPrice, minArea, maxArea, sortBy },
        page,
        PAGE_SIZE
      ),
    initialData: initialQuery === serverInitialQuery ? initialResults ?? undefined : undefined,
    placeholderData: (prev) => prev,
  });

  const listings = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    router.push(`/tim-kiem?q=${encodeURIComponent(searchInput)}`);
  };

  const inputClass = "w-full px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="flex-1 relative max-w-2xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="VD: Nguyễn Trãi Quận 1, chung cư Bình Thạnh..."
            className="w-full pl-12 pr-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button type="submit"
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
          Tìm kiếm
        </button>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-56 shrink-0 space-y-5">
          <div className="bg-white rounded-2xl shadow-card border border-border p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Lọc kết quả</h3>

            {/* Loại BDS */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">Loại BDS</label>
              <div className="space-y-1">
                {LISTING_TYPES.map((t) => (
                  <button key={t.value} onClick={() => { setListingType(t.value); setPage(1); }}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                      listingType === t.value ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">Khoảng giá (VNĐ)</label>
              <input type="number" placeholder="Giá thấp nhất" value={minPrice ?? ""}
                onChange={(e) => { setMinPrice(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className={clsx(inputClass, "mb-2")} />
              <input type="number" placeholder="Giá cao nhất" value={maxPrice ?? ""}
                onChange={(e) => { setMaxPrice(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className={inputClass} />
            </div>

            {/* Diện tích */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">Diện tích (m²)</label>
              <input type="number" placeholder="Tối thiểu" value={minArea ?? ""}
                onChange={(e) => { setMinArea(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className={clsx(inputClass, "mb-2")} />
              <input type="number" placeholder="Tối đa" value={maxArea ?? ""}
                onChange={(e) => { setMaxArea(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                className={inputClass} />
            </div>

            {/* Sắp xếp */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Sắp xếp</label>
              <select value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                className={inputClass}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              {initialQuery ? (
                <h1 className="text-lg font-bold text-gray-900">
                  Kết quả cho &ldquo;{initialQuery}&rdquo;
                </h1>
              ) : (
                <h1 className="text-lg font-bold text-gray-900">Tin đăng mới nhất</h1>
              )}
              {total > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {total.toLocaleString("vi-VN")} tin đăng
                  {isFetching && !isLoading && " · Đang cập nhật..."}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-500 font-medium mb-1">
                {initialQuery ? `Không tìm thấy kết quả cho "${initialQuery}"` : "Chưa có tin đăng nào"}
              </p>
              <p className="text-sm text-gray-400">Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">
                    ← Trước
                  </button>
                  <span className="text-sm text-gray-600">Trang {page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors">
                    Tiếp →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CompareTray />
    </div>
  );
}

export function SearchClient(props: SearchClientProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <ListingCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <SearchContent {...props} />
    </Suspense>
  );
}
