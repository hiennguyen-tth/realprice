"use client";

import Image from "next/image";
import Link from "next/link";
import { formatArea, formatPricePerM2, formatListingType, formatDate, formatShortPrice } from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import { CompareButton } from "./CompareButton";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const thumbUrl = listing.images?.[0];
  const pricePerM2 = listing.pricePerM2 > 0
    ? listing.pricePerM2
    : listing.area > 0 ? Math.round(listing.price / listing.area) : 0;

  return (
    <article
      className="group bg-white rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200"
      itemScope
      itemType="https://schema.org/RealEstateListing"
    >
      {/* Thumbnail */}
      <Link
        href={`/listing/${listing.id}`}
        className="block relative"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
              itemProp="image"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
              <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs">Chưa có ảnh</span>
            </div>
          )}

          {/* Status badge */}
          {listing.status !== "active" && (
            <div className="absolute top-2 left-2">
              <Badge
                variant={listing.status === "sold" ? "error" : "warning"}
                size="sm"
              >
                {listing.status === "sold" ? "Đã bán" : "Hết hạn"}
              </Badge>
            </div>
          )}

          {/* Image count */}
          {(listing.images?.length ?? 0) > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs backdrop-blur-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
              {listing.images.length}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Price row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-lg font-bold text-primary leading-tight" itemProp="price">
              {formatShortPrice(listing.price)}
            </p>
            {pricePerM2 > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatPricePerM2(pricePerM2)}
              </p>
            )}
          </div>
          <CompareButton listing={listing} size="sm" />
        </div>

        {/* Title */}
        <Link href={`/listing/${listing.id}`} itemProp="name">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors leading-snug mb-2">
            {listing.title}
          </h3>
        </Link>

        {/* Address */}
        <p
          className="text-xs text-gray-500 flex items-start gap-1 mb-3"
          itemProp="address"
        >
          <svg className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{listing.address}</span>
        </p>

        {/* Meta tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {listing.area > 0 && (
            <Badge variant="default" size="sm">
              {formatArea(listing.area)}
            </Badge>
          )}
          <Badge variant="primary" size="sm">
            {formatListingType(listing.listingType)}
          </Badge>
        </div>

        {/* Date + view link */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">{formatDate(listing.createdAt)}</p>
          <Link
            href={`/listing/${listing.id}`}
            className="text-xs text-primary font-medium hover:underline"
            aria-label={`Xem chi tiết: ${listing.title}`}
          >
            Xem chi tiết →
          </Link>
        </div>
      </div>
    </article>
  );
}
