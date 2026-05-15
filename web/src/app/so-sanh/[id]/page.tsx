"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getComparison } from "@/lib/api";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { AnalysisSummary } from "@/components/comparison/AnalysisSummary";
import { CompareTray } from "@/components/comparison/CompareTray";
import { Skeleton } from "@/components/common/Skeleton";

interface Props {
  params: { id: string };
}
export default function ComparisonResultPage({ params }: Props) {
  const { id } = (params);

  const { data: comparison, isLoading, error } = useQuery({
    queryKey: ["comparison", id],
    queryFn: () => getComparison(id),
    enabled: !!id,
    retry: 1,
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "So sánh bất động sản — RealPrice", url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Đã sao chép link!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !comparison || !comparison.analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Không tìm thấy kết quả so sánh.</p>
        <Link
          href="/so-sanh"
          className="text-primary hover:underline font-medium"
        >
          Tạo so sánh mới
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/so-sanh" className="hover:text-primary transition-colors">
              So sánh
            </Link>
            <span>›</span>
            <span>Kết quả</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            So sánh {comparison.items.length} bất động sản
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 border border-border hover:border-primary text-gray-700 hover:text-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Chia sẻ
          </button>
          <Link
            href="/so-sanh"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            So sánh mới
          </Link>
        </div>
      </div>

      {/* Analysis summary */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Phân tích tổng quan</h2>
        <AnalysisSummary
          items={comparison.items}
          analysis={comparison.analysis}
        />
      </section>

      {/* Comparison table */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Bảng so sánh chi tiết</h2>
        <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden p-4">
          <ComparisonTable
            items={comparison.items}
            analysis={comparison.analysis}
          />
        </div>
      </section>

      {/* CTA per listing */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Liên hệ người bán</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparison.items.map((item, idx) => (
            <div
              key={item.listing.id}
              className="bg-white rounded-2xl border border-border p-4 text-center"
            >
              <p className="text-xs text-gray-500 mb-1">Tin #{idx + 1}</p>
              <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-3">
                {item.listing.title}
              </p>
              {item.listing.contactPhone && (
                <a
                  href={`tel:${item.listing.contactPhone}`}
                  className="block bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Gọi ngay
                </a>
              )}
              <Link
                href={`/listing/${item.listing.id}`}
                className="block mt-2 text-xs text-primary hover:underline"
              >
                Xem chi tiết
              </Link>
            </div>
          ))}
        </div>
      </section>

      <CompareTray />
    </div>
  );
}
