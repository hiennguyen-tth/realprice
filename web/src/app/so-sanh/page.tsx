"use client";

import Link from "next/link";
import { useComparison } from "@/hooks/useComparison";
import { ListingCard } from "@/components/listing/ListingCard";
import { CompareTray } from "@/components/comparison/CompareTray";

export default function ComparisonEmptyPage() {
  const { items, canCompare, startComparison, isCreatingComparison } =
    useComparison();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {items.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M15 13l-3 3m0 0l-3-3m3 3V8"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Chưa có bất động sản nào để so sánh
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            Duyệt bản đồ giá hoặc tìm kiếm bất động sản, sau đó nhấn nút{" "}
            <strong className="text-primary">So sánh</strong> trên các tin đăng
            bạn muốn so sánh (tối đa 4 tin).
          </p>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-left">
            {[
              {
                step: "1",
                title: "Tìm bất động sản",
                desc: "Dùng bản đồ hoặc thanh tìm kiếm",
                href: "/map",
                cta: "Mở bản đồ",
              },
              {
                step: "2",
                title: "Nhấn So sánh",
                desc: "Thêm tối đa 4 tin vào danh sách so sánh",
                href: null,
                cta: null,
              },
              {
                step: "3",
                title: "Xem kết quả",
                desc: "Bảng so sánh chi tiết và phân tích tự động",
                href: null,
                cta: null,
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white rounded-2xl border border-border p-4"
              >
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
                {s.href && s.cta && (
                  <Link
                    href={s.href}
                    className="mt-3 inline-block text-xs text-primary hover:underline font-medium"
                  >
                    {s.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Khám phá bản đồ giá
          </Link>
        </div>
      ) : (
        /* Has items */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              So sánh ({items.length}/4)
            </h1>
            {canCompare && (
              <button
                onClick={() => startComparison()}
                disabled={isCreatingComparison}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                {isCreatingComparison ? "Đang tạo..." : "So sánh ngay →"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <p className="text-sm text-gray-500 text-center">
            {items.length < 2
              ? `Thêm ${2 - items.length} tin nữa để so sánh`
              : `Nhấn "So sánh ngay" để xem bảng so sánh chi tiết`}
          </p>
        </div>
      )}

      <CompareTray />
    </div>
  );
}
