"use client";

import Image from "next/image";
import { formatShortPrice, formatArea, formatPricePerM2, formatListingType } from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import type { PostListingFormData } from "@/hooks/usePostListing";

interface StepPreviewProps {
  formData: PostListingFormData;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  uploadProgress: number;
}

export function StepPreview({
  formData,
  onPrev,
  onSubmit,
  isSubmitting,
  uploadProgress,
}: StepPreviewProps) {
  const pricePerM2 =
    formData.price && formData.area
      ? Math.round(formData.price / formData.area)
      : 0;

  const previews = formData.imageFiles.map((f) => URL.createObjectURL(f));
  const allImages = [...previews, ...formData.imageUrls];
  const thumbUrl = allImages[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Xem trước & đăng tin</h2>
        <p className="text-sm text-gray-500 mt-1">
          Kiểm tra lại thông tin trước khi đăng. Bạn có thể quay lại để chỉnh sửa.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-2xl border-2 border-primary/30 shadow-card overflow-hidden">
        {/* Image */}
        <div className="relative h-56 bg-gray-100">
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Chưa có ảnh</p>
              </div>
            </div>
          )}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              +{allImages.length - 1} ảnh
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Price + badges */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatShortPrice(formData.price)}
              </p>
              {pricePerM2 > 0 && (
                <p className="text-sm text-gray-500">
                  {formatPricePerM2(pricePerM2)}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge variant="primary">{formatListingType(formData.listingType)}</Badge>
              <Badge variant="default">{formatArea(formData.area)}</Badge>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="font-semibold text-gray-900">{formData.title || "Chưa có tiêu đề"}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {formData.address}, {formData.district}
            </p>
          </div>

          {/* Description preview */}
          {formData.description && (
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {formData.description}
            </p>
          )}

          {/* Contact */}
          <div className="border-t border-border pt-3">
            <p className="text-xs text-gray-500">
              Liên hệ: <span className="font-medium text-gray-700">{formData.contactName}</span>
              {" · "}
              <span className="font-medium text-primary">{formData.contactPhone}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Đang tải ảnh lên...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-400 leading-relaxed">
        Bằng cách đăng tin, bạn đồng ý với{" "}
        <a href="#" className="text-primary hover:underline">Điều khoản sử dụng</a>
        {" "}và{" "}
        <a href="#" className="text-primary hover:underline">Chính sách bảo mật</a>
        {" "}của RealPrice.
      </p>

      {/* Nav buttons */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ← Quay lại
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Đang đăng...
            </>
          ) : (
            "Đăng tin ngay"
          )}
        </button>
      </div>
    </div>
  );
}
