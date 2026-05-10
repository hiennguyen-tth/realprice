"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createLead } from "@/lib/api";
import {
  formatShortPrice,
  formatPricePerM2,
  formatArea,
  formatListingType,
  formatDate,
} from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import { PriceTag } from "@/components/common/PriceTag";
import { CompareButton } from "./CompareButton";
import type { Listing } from "@/types";

const leadSchema = z.object({
  name: z.string().min(2, "Vui lòng nhập họ tên"),
  phone: z.string().min(9, "Số điện thoại không hợp lệ"),
  message: z.string().optional(),
});

type LeadForm = z.infer<typeof leadSchema>;

interface ListingDetailViewProps {
  listing: Listing;
}

export function ListingDetailView({ listing }: ListingDetailViewProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [leadSent, setLeadSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadForm>({ resolver: zodResolver(leadSchema) });

  const { mutate: sendLead, isPending } = useMutation({
    mutationFn: (data: LeadForm) =>
      createLead({ listingId: listing.id, ...data }),
    onSuccess: () => {
      setLeadSent(true);
      reset();
    },
  });

  const images = listing.images.length > 0
    ? listing.images
    : ["/placeholder-property.jpg"];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-border">
            <div className="relative h-72 sm:h-96">
              <Image
                src={images[activeImageIdx]}
                alt={listing.title}
                fill
                className="object-cover"
                priority
                unoptimized={images[activeImageIdx].startsWith('https://cdn.chotot.com') || images[activeImageIdx].startsWith('https://static.chotot.com')}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImageIdx
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                  >
                    <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover"
                      unoptimized={img.startsWith('https://cdn.chotot.com') || img.startsWith('https://static.chotot.com')}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl shadow-card border border-border p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="primary">{formatListingType(listing.listingType)}</Badge>
                  <Badge variant={listing.status === "active" ? "success" : "warning"}>
                    {listing.status === "active" ? "Đang bán" : "Hết hạn"}
                  </Badge>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {listing.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {listing.address}
                </p>
              </div>
              <CompareButton listing={listing} />
            </div>

            {/* Price stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-surface-secondary rounded-xl mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Giá bán</p>
                <PriceTag price={listing.price} size="lg" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Diện tích</p>
                <p className="text-base font-bold text-gray-900">
                  {formatArea(listing.area)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Giá/m²</p>
                <p className="text-base font-bold text-gray-700">
                  {formatPricePerM2(listing.pricePerM2)}
                </p>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4">
              Đăng ngày {formatDate(listing.createdAt)}
            </p>
          </div>
        </div>

        {/* Right column: contact form */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card border border-border p-5 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-1">Liên hệ người bán</h3>
            {listing.contactName && (
              <p className="text-sm text-gray-600 mb-4">
                {listing.contactName}
              </p>
            )}

            {leadSent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Đã gửi thành công!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Người bán sẽ liên hệ với bạn sớm.
                </p>
                <button
                  onClick={() => setLeadSent(false)}
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Gửi lại
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit((d) => sendLead(d))} className="space-y-3">
                <div>
                  <input
                    {...register("name")}
                    placeholder="Họ và tên"
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register("phone")}
                    placeholder="Số điện thoại"
                    type="tel"
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <textarea
                    {...register("message")}
                    placeholder="Tin nhắn (tùy chọn)"
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </form>
            )}

            {listing.contactPhone ? (
              <a
                href={`tel:${listing.contactPhone}`}
                className="flex items-center justify-center gap-2 mt-3 w-full border-2 border-primary text-primary hover:bg-primary/5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Gọi ngay
              </a>
            ) : listing.sourceUrl ? (
              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-3 w-full border-2 border-gray-300 text-gray-600 hover:border-primary hover:text-primary py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Xem SĐT trên {listing.source === 'nhatot' ? 'Chợ Tốt' : 'trang gốc'}
              </a>
            ) : (
              <p className="mt-3 text-xs text-gray-400 text-center">
                Không có thông tin liên hệ
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
