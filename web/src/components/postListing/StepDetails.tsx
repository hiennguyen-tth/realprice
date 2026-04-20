"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clsx } from "clsx";
import type { PostListingFormData } from "@/hooks/usePostListing";
import type { ListingType } from "@/types";
import { formatListingType } from "@/lib/formatters";

const detailsSchema = z.object({
  title: z.string().min(10, "Tiêu đề tối thiểu 10 ký tự"),
  description: z.string().min(20, "Mô tả tối thiểu 20 ký tự"),
  price: z.coerce.number().min(100_000_000, "Giá tối thiểu 100 triệu"),
  area: z.coerce.number().min(10, "Diện tích tối thiểu 10 m²"),
  listingType: z.enum(["dat_nen", "nha_pho", "chung_cu", "biet_thu", "van_phong"]),
  contactName: z.string().min(2, "Vui lòng nhập họ tên"),
  contactPhone: z.string().min(9, "Số điện thoại không hợp lệ"),
});

type DetailsForm = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  formData: PostListingFormData;
  updateForm: (updates: Partial<PostListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const LISTING_TYPES: ListingType[] = [
  "dat_nen", "nha_pho", "chung_cu", "biet_thu", "van_phong",
];

export function StepDetails({ formData, updateForm, onNext, onPrev }: StepDetailsProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: formData.title,
      description: formData.description,
      price: formData.price || undefined,
      area: formData.area || undefined,
      listingType: formData.listingType,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
    },
  });

  const onSubmit = (data: DetailsForm) => {
    updateForm(data);
    onNext();
  };

  const priceValue = watch("price");
  const areaValue = watch("area");
  const pricePerM2 = priceValue && areaValue ? Math.round(priceValue / areaValue) : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Thông tin bất động sản</h2>
        <p className="text-sm text-gray-500 mt-1">Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn.</p>
      </div>

      {/* Listing type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại bất động sản <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LISTING_TYPES.map((type) => (
            <label key={type} className="cursor-pointer">
              <input
                type="radio"
                value={type}
                {...register("listingType")}
                className="sr-only peer"
              />
              <div className="border-2 border-border rounded-xl py-2 px-3 text-center text-sm font-medium text-gray-700 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary hover:border-primary/50 transition-all">
                {formatListingType(type)}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Tiêu đề tin đăng <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title")}
          placeholder="VD: Bán nhà mặt tiền Nguyễn Huệ, Quận 1, 5x20m, giá 12 tỷ"
          className={clsx(
            "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
            errors.title ? "border-red-400" : "border-border focus:border-primary"
          )}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* Price + area row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Giá bán (VNĐ) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("price")}
            type="number"
            placeholder="3500000000"
            className={clsx(
              "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              errors.price ? "border-red-400" : "border-border focus:border-primary"
            )}
          />
          {errors.price ? (
            <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
          ) : pricePerM2 > 0 ? (
            <p className="text-xs text-gray-500 mt-1">
              ≈ {(pricePerM2 / 1_000_000).toFixed(0)} triệu/m²
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Diện tích (m²) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("area")}
            type="number"
            step="0.1"
            placeholder="85.5"
            className={clsx(
              "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              errors.area ? "border-red-400" : "border-border focus:border-primary"
            )}
          />
          {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Mô tả <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("description")}
          rows={5}
          placeholder="Mô tả chi tiết về bất động sản: vị trí, pháp lý, tiện ích, tình trạng..."
          className={clsx(
            "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none",
            errors.description ? "border-red-400" : "border-border focus:border-primary"
          )}
        />
        {errors.description && (
          <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Contact */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin liên hệ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              {...register("contactName")}
              placeholder="Nguyễn Văn A"
              className={clsx(
                "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                errors.contactName ? "border-red-400" : "border-border focus:border-primary"
              )}
            />
            {errors.contactName && (
              <p className="text-xs text-red-500 mt-1">{errors.contactName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              {...register("contactPhone")}
              type="tel"
              placeholder="0901234567"
              className={clsx(
                "w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                errors.contactPhone ? "border-red-400" : "border-border focus:border-primary"
              )}
            />
            {errors.contactPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Quay lại
        </button>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          Tiếp theo →
        </button>
      </div>
    </form>
  );
}
