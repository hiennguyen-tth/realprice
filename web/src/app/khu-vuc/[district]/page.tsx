import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import {
  getDistrictOverview,
  getListings,
  getBankValuations,
  getDistrictHeatmap,
} from "@/lib/api";
import {
  generateDistrictMetadata,
  generateDistrictStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";
import { formatShortPrice, formatPricePerM2, formatPercent } from "@/lib/formatters";
import { ListingsList } from "@/components/land/ListingsList";
import { Badge } from "@/components/common/Badge";

interface Props {
  params: Promise<{ district: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district } = await params;
  try {
    const stats = await getDistrictOverview(decodeURIComponent(district));
    return generateDistrictMetadata(decodeURIComponent(district), stats);
  } catch {
    return { title: `Giá BDS ${decodeURIComponent(district)}` };
  }
}

export default async function DistrictPage({ params }: Props) {
  const { district } = await params;
  const decodedDistrict = decodeURIComponent(district);

  const [statsResult, listingsResult, bankValResult, heatmapResult] = await Promise.allSettled([
    getDistrictOverview(decodedDistrict),
    getListings("", 1, 8, { district: decodedDistrict, sortBy: "newest" }),
    getBankValuations(decodedDistrict),
    getDistrictHeatmap(decodedDistrict),
  ]);

  if (statsResult.status === "rejected") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Không tìm thấy quận {decodedDistrict}
        </h1>
        <Link href="/" className="text-primary hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  const stats = statsResult.value;
  const listings = listingsResult.status === "fulfilled" ? listingsResult.value.data : [];
  const bankVals = bankValResult.status === "fulfilled" ? bankValResult.value : [];

  const districtJsonLd = generateDistrictStructuredData(decodedDistrict, stats);
  const breadcrumbJsonLd = generateBreadcrumbStructuredData([
    { name: "Trang chủ", url: "/" },
    { name: decodedDistrict, url: `/khu-vuc/${district}` },
  ]);

  const priceChangeUp = stats.priceChange30d > 0;

  return (
    <>
      <Script
        id="district-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(districtJsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{decodedDistrict}</span>
        </nav>

        {/* Hero stats */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                Giá bất động sản {decodedDistrict}
              </h1>
              <p className="text-gray-400 text-sm">
                Dữ liệu từ {stats.totalListings.toLocaleString("vi-VN")} tin đăng
              </p>
            </div>
            <Badge
              variant={priceChangeUp ? "error" : "success"}
            >
              {priceChangeUp ? "▲" : "▼"} {formatPercent(Math.abs(stats.priceChange30d))} 30 ngày
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Trung bình/m²",
                value: formatPricePerM2(stats.avgPricePerM2),
                color: "text-primary-light",
              },
              {
                label: "Thấp nhất/m²",
                value: formatPricePerM2(stats.minPricePerM2),
                color: "text-green-400",
              },
              {
                label: "Cao nhất/m²",
                value: formatPricePerM2(stats.maxPricePerM2),
                color: "text-red-400",
              },
              {
                label: "Tổng tin đăng",
                value: stats.totalListings.toLocaleString("vi-VN"),
                color: "text-blue-400",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top streets */}
        {stats.topStreets.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tuyến đường có giá cao nhất
            </h2>
            <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tuyến đường</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Giá TB/m²</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Tin đăng</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {stats.topStreets.map((street, idx) => (
                    <tr key={street.street} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-900">{street.street}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {formatPricePerM2(street.avgPricePerM2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {street.totalListings}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/land/${encodeURIComponent(district)}/${encodeURIComponent(street.street)}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Heatmap overview */}
        {heatmapResult.status === 'fulfilled' && heatmapResult.value.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Heatmap khu vực
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heatmapResult.value.map((area) => (
                <div key={area.id} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                  <p className="text-sm font-semibold text-gray-900 mb-2">{area.name || area.district}</p>
                  <p className="text-xs text-gray-500 mb-1">Giá trung bình/m²: {formatPricePerM2(area.pricePerM2)}</p>
                  <p className="text-xs text-gray-500">Cấp độ giá: {area.priceLevel}</p>
                  <p className="text-xs text-gray-400 mt-2">Cập nhật: {new Date(area.updatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bank valuation summary */}
        {bankVals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tổng hợp định giá ngân hàng
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankVals.slice(0, 6).map((bv) => (
                <div
                  key={bv.id}
                  className="bg-white rounded-2xl border border-border p-4 shadow-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-900">{bv.bankName}</span>
                    <Badge variant="info" size="sm">{bv.ltvRatio}% LTV</Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatShortPrice(bv.valuationPrice)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vay tối đa: {formatShortPrice(bv.maxLoan)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Latest listings */}
        {listings.length > 0 && (
          <ListingsList listings={listings} title={`Tin đăng mới nhất — ${decodedDistrict}`} />
        )}

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">
            Bạn muốn bán BDS tại {decodedDistrict}?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Đăng tin miễn phí, tiếp cận khách hàng trong khu vực ngay hôm nay.
          </p>
          <Link
            href="/dang-tin"
            className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Đăng tin ngay
          </Link>
        </div>
      </div>
    </>
  );
}
