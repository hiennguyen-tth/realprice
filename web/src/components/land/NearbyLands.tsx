import Link from "next/link";
import { formatShortPrice, formatPricePerM2 } from "@/lib/formatters";
import type { Land } from "@/types";

interface NearbyLandsProps {
  lands: Land[];
}

export function NearbyLands({ lands }: NearbyLandsProps) {
  if (!lands.length) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Khu vực lân cận
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lands.map((land) => (
          <Link
            key={land.id}
            href={`/land/${encodeURIComponent(land.district)}/${encodeURIComponent(land.street)}`}
            className="block bg-white rounded-2xl shadow-card border border-border p-4 hover:shadow-card-hover hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors truncate">
                  {land.street}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{land.district}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-primary">
                  {formatShortPrice(land.avgPrice)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPricePerM2(land.pricePerM2)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
              <span>{land.totalListings} tin đăng</span>
              <span className="text-primary group-hover:underline">Xem chi tiết →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
