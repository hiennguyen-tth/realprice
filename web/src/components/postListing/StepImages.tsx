"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import type { PostListingFormData } from "@/hooks/usePostListing";

const MAX_IMAGES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp";

interface StepImagesProps {
  formData: PostListingFormData;
  updateForm: (updates: Partial<PostListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StepImages({ formData, updateForm, onNext, onPrev }: StepImagesProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>(
    formData.imageFiles.map((f) => URL.createObjectURL(f))
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const combined = [...formData.imageFiles, ...newFiles].slice(0, MAX_IMAGES);
      updateForm({ imageFiles: combined });
      setPreviews(combined.map((f) => URL.createObjectURL(f)));
    },
    [formData.imageFiles, updateForm]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (idx: number) => {
    const newFiles = formData.imageFiles.filter((_, i) => i !== idx);
    const newPreviews = previews.filter((_, i) => i !== idx);
    updateForm({ imageFiles: newFiles });
    setPreviews(newPreviews);
  };

  const moveImage = (from: number, to: number) => {
    const newFiles = [...formData.imageFiles];
    const newPreviews = [...previews];
    [newFiles[from], newFiles[to]] = [newFiles[to], newFiles[from]];
    [newPreviews[from], newPreviews[to]] = [newPreviews[to], newPreviews[from]];
    updateForm({ imageFiles: newFiles });
    setPreviews(newPreviews);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Hình ảnh</h2>
        <p className="text-sm text-gray-500 mt-1">
          Đăng tối đa {MAX_IMAGES} ảnh. Ảnh đầu tiên sẽ là ảnh bìa. Kéo thả để sắp xếp.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
        }`}
      >
        <input
          type="file"
          accept={ACCEPT}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">
              Kéo thả ảnh vào đây hoặc{" "}
              <span className="text-primary">chọn từ máy tính</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP — tối đa 5MB/ảnh</p>
          </div>
          {previews.length > 0 && (
            <p className="text-xs text-primary font-medium">
              {previews.length}/{MAX_IMAGES} ảnh đã chọn
            </p>
          )}
        </div>
      </div>

      {/* Image grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {previews.map((src, idx) => (
            <div key={idx} className="relative group aspect-square">
              <Image
                src={src}
                alt={`Ảnh ${idx + 1}`}
                fill
                className="object-cover rounded-xl border border-border"
              />
              {/* Cover badge */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  Ảnh bìa
                </div>
              )}
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button
                    onClick={() => moveImage(idx, idx - 1)}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
                    title="Di chuyển lên"
                  >
                    ←
                  </button>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  title="Xóa ảnh"
                >
                  ✕
                </button>
                {idx < previews.length - 1 && (
                  <button
                    onClick={() => moveImage(idx, idx + 1)}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
                    title="Di chuyển xuống"
                  >
                    →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-2.5 border border-border rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Quay lại
        </button>
        <button
          onClick={onNext}
          className="bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {previews.length === 0 ? "Bỏ qua →" : "Tiếp theo →"}
        </button>
      </div>
    </div>
  );
}
