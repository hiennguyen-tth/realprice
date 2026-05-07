"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { getLandById, getListings } from "@/lib/api";
import { formatShortPrice, formatPricePerM2, formatPercent } from "@/lib/formatters";
import { Skeleton } from "@/components/common/Skeleton";
import { Badge } from "@/components/common/Badge";
import { CompareButton } from "@/components/listing/CompareButton";
import type { Listing } from "@/types";

interface LandSidepanelProps {
  landId: string;
  onClose: () => void;
}

export function LandSidepanel({ landId, onClose }: LandSidepanelProps) {
  const { data: land, isLoading: landLoading } = useQuery({
    queryKey: ["land", landId],
    queryFn: () => getLandById(landId),
    enabled: !!landId,
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", landId],
    queryFn: () => getListings(landId, 1, 5),
    enabled: !!landId,
  });

  const listings = listingsData?.data ?? [];
  const totalListings = land?.totalListings ?? listingsData?.pagination.total ?? listings.length;

  return (
    <div className="h-full flex flex-col bg-white animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0 pr-2">
          {landLoading ? (
            <Skeleton variant="text" className="w-3/4 h-5 mb-1" />
          ) : (
            <h2 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {land?.street}
            </h2>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{land?.district}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Price stats */}
      <div className="p-4 bg-surface-secondary border-b border-border">
        {landLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : land ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Thấp nhất</p>
              <p className="text-sm font-bold text-green-600">
                {formatShortPrice(listings.length > 0 ? Math.min(...listings.map((l: any) => Number(l.price))) : land.minPrice)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Trung bình</p>
              <p className="text-sm font-bold text-primary">
                {formatShortPrice(listings.length > 0 ? listings.reduce((s: number, l: any) => s + Number(l.price), 0) / listings.length : land.avgPrice)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Cao nhất</p>
              <p className="text-sm font-bold text-red-600">
                {formatShortPrice(listings.length > 0 ? Math.max(...listings.map((l: any) => Number(l.price))) : land.maxPrice)}
              </p>
            </div>
          </div>
        ) : null}
        {land && (
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500">Trung bình: </span>
            <span className="text-xs font-semibold text-gray-700">
              {formatPricePerM2(land.pricePerM2)}
            </span>
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {listingsLoading ? "Đang tải..." : `${totalListings} tin đăng`}
          </h3>
          {land && (
            <Link
              href={`/listings?landId=${land.id}`}
              className="text-xs text-primary hover:underline"
            >
              Xem tất cả
            </Link>
          )}
        </div>

        {listingsLoading
          ? [1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-24 w-full" />
            </div>
          ))
          : listings.map((listing) => (
            <SidepanelListingCard key={listing.id} listing={listing} />
          ))}
      </div>

      {/* Footer CTA */}
      {land && (
        <div className="p-4 border-t border-border">
          <Link
            href={`/listings?landId=${land.id}`}
            className="block w-full text-center bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Xem chi tiết khu vực
          </Link>
        </div>
      )}
    </a>
  );
}

function SidepanelListingCard({ listing }: { listing: Listing }) {
  const thumb = listing.images[0];

  return (
    <a href={`/listing/${listing.id}`} className="flex gap-3 p-3 bg-surface-secondary rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
        {thumb ? (
          <Image
            src={thumb}
            alt={listing.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary font-bold">
          {formatShortPrice(listing.price)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {listing.area} m² · {formatPricePerM2(listing.pricePerM2)}
        </p>
        <p className="text-xs text-gray-700 truncate mt-0.5">{listing.title}</p>
      </div>

      {/* Compare */}
      <div className="shrink-0">
        <CompareButton listing={listing} size="sm" />
      </div>
    </a>
  );
}
