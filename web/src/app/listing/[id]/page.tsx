"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListingById } from "@/lib/api";
import { ListingDetailView } from "@/components/listing/ListingDetailView";
import { LandDetailSkeleton } from "@/components/common/Skeleton";
import { CompareTray } from "@/components/comparison/CompareTray";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ListingPage({ params }: Props) {
  const { id } = use(params);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListingById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LandDetailSkeleton />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Không tìm thấy tin đăng
        </h1>
        <p className="text-gray-500 mb-6">
          Tin đăng này đã bị xóa hoặc không tồn tại.
        </p>
        <Link href="/tim-kiem" className="text-primary hover:underline font-medium">
          Tìm bất động sản khác
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <span>›</span>
        {listing.land && (
          <>
            <Link
              href={`/khu-vuc/${encodeURIComponent(listing.land.district.toLowerCase().replace(/\s+/g, "-"))}`}
              className="hover:text-primary transition-colors"
            >
              {listing.land.district}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-900 truncate max-w-xs">{listing.title}</span>
      </nav>

      <ListingDetailView listing={listing} />
      <CompareTray />
    </div>
  );
}
