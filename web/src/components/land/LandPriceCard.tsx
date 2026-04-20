import { formatShortPrice, formatPricePerM2, formatPercent } from "@/lib/formatters";
import { Badge } from "@/components/common/Badge";
import type { Land } from "@/types";

interface LandPriceCardProps {
  land: Land;
  priceChange30d?: number;
}

export function LandPriceCard({ land, priceChange30d }: LandPriceCardProps) {
  const trend = priceChange30d ?? 0;
  const trendUp = trend > 0;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-6">
      {/* Address */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 leading-tight">
          {land.street}, {land.district}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{land.city}</p>
      </div>

      {/* Price range */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Thấp nhất</p>
          <p className="text-sm font-bold text-green-600">
            {formatShortPrice(land.minPrice)}
          </p>
        </div>
        <div className="text-center p-3 bg-primary/5 rounded-xl border-2 border-primary/20">
          <p className="text-xs text-primary/70 mb-1">Trung bình</p>
          <p className="text-sm font-bold text-primary">
            {formatShortPrice(land.avgPrice)}
          </p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Cao nhất</p>
          <p className="text-sm font-bold text-red-600">
            {formatShortPrice(land.maxPrice)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div>
          <p className="text-xs text-gray-500">Giá/m² trung bình</p>
          <p className="text-base font-bold text-gray-900">
            {formatPricePerM2(land.pricePerM2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Tổng tin đăng</p>
          <p className="text-base font-bold text-gray-900">{land.totalListings}</p>
        </div>
        {priceChange30d !== undefined && (
          <div className="text-right">
            <p className="text-xs text-gray-500">30 ngày</p>
            <Badge variant={trendUp ? "error" : "success"} size="sm">
              {trendUp ? "▲" : "▼"} {formatPercent(Math.abs(trend), 1)}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
