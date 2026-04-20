"use client";

import Image from "next/image";
import Link from "next/link";
import { formatShortPrice, formatArea, formatPricePerM2, formatListingType, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import { PriceTag } from "@/components/common/PriceTag";
import { CompareButton } from "./CompareButton";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const thumbUrl = listing.images[0];

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all duration-200">
      {/* Image */}
      <Link href={`/listing/${listing.id}`} className="block relative">
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
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
          {listing.images.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
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
        {/* Price + compare */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <PriceTag
            price={listing.price}
            pricePerM2={listing.pricePerM2}
            showPerM2
            size="md"
          />
          <CompareButton listing={listing} size="sm" />
        </div>

        {/* Title */}
        <Link href={`/listing/${listing.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-primary transition-colors leading-snug mb-2">
            {listing.title}
          </h3>
        </Link>

        {/* Address */}
        <p className="text-xs text-gray-500 flex items-start gap-1 mb-3">
          <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{listing.address}</span>
        </p>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" size="sm">
            {formatArea(listing.area)}
          </Badge>
          <Badge variant="primary" size="sm">
            {formatListingType(listing.listingType)}
          </Badge>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400 mt-3">
          {formatDate(listing.createdAt)}
        </p>
      </div>
    </article>
  );
}
