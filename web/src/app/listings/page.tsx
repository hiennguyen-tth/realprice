"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getLandById, getListings } from "@/lib/api";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingCardSkeleton } from "@/components/common/Skeleton";
import { CompareTray } from "@/components/comparison/CompareTray";
import { formatShortPrice, formatPricePerM2 } from "@/lib/formatters";
import type { ListingType } from "@/types";
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
  { value: "area_asc", label: "Diện tích tăng" },
] as const;

const PAGE_SIZE = 12;

function ListingsContent() {
  const searchParams = useSearchParams();
  const landId = searchParams.get("landId") ?? "";

  const [listingType, setListingType] = useState<ListingType | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "area_asc">("newest");
  const [page, setPage] = useState(1);

  const { data: land, isLoading: landLoading } = useQuery({
    queryKey: ["land", landId],
    queryFn: () => getLandById(landId),
    enabled: !!landId,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", landId, listingType, sortBy, page],
    queryFn: () =>
      getListings(landId, page, PAGE_SIZE, {
        listingType: listingType || undefined,
        sortBy,
      }),
    enabled: !!landId,
    placeholderData: (prev) => prev,
  });

  const listings = listingsData?.data ?? [];
  const total = listingsData?.pagination.total ?? 0;
  const totalPages = listingsData?.pagination.totalPages ?? 1;

  if (!landId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Không tìm thấy bất động sản.</p>
        <Link href="/tim-kiem" className="text-primary hover:underline mt-3 inline-block">
          Tìm kiếm bất động sản
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <span>›</span>
        <Link href="/map" className="hover:text-primary transition-colors">Bản đồ giá</Link>
        <span>›</span>
        {landLoading ? (
          <span className="h-4 w-32 bg-gray-200 rounded animate-pulse inline-block" />
        ) : land ? (
          <>
            <Link
              href={`/khu-vuc/${encodeURIComponent((land.district ?? "").toLowerCase().replace(/\s+/g, "-"))}`}
              className="hover:text-primary transition-colors"
            >
              {land.district}
            </Link>
            <span>›</span>
            <span className="text-gray-900">{land.address}</span>
          </>
        ) : (
          <span className="text-gray-900">Tin đăng</span>
        )}
      </nav>

      {/* Land price summary */}
      {!landLoading && land && (
        <div className="bg-white rounded-2xl shadow-card border border-border p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{land.address}</h1>
              <p className="text-sm text-gray-500 mt-1">{land.district}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Thấp nhất</p>
                <p className="text-base font-bold text-green-600">{formatShortPrice(land.minPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Trung bình</p>
                <p className="text-base font-bold text-primary">{formatShortPrice(land.avgPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Cao nhất</p>
                <p className="text-base font-bold text-red-600">{formatShortPrice(land.maxPrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">TB/m²</p>
                <p className="text-base font-bold text-gray-700">{formatPricePerM2(land.pricePerM2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="lg:w-52 shrink-0">
          <div className="bg-white rounded-2xl shadow-card border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm text-gray-900">Lọc kết quả</h3>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Loại BDS</label>
              <div className="space-y-1">
                {LISTING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setListingType(t.value); setPage(1); }}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                      listingType === t.value
                        ? "bg-primary text-white font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Sắp xếp</label>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                className="w-full px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Listings grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {listingsLoading
                ? "Đang tải..."
                : `${total.toLocaleString("vi-VN")} tin đăng`}
            </p>
            <Link
              href={`/map`}
              className="text-sm text-primary hover:underline"
            >
              ← Quay lại bản đồ
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">Chưa có tin đăng nào tại khu vực này</p>
              <Link href="/dang-tin" className="mt-3 inline-block text-primary hover:underline text-sm font-medium">
                Đăng tin ngay
              </Link>
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
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    ← Trước
                  </button>
                  <span className="text-sm text-gray-600">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-border rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
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

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-6 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
