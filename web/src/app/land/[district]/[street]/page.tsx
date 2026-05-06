import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { getLandBySlug, getListings, getPriceHistory, getBankValuationsForLand, getNearbyLands } from "@/lib/api";
import { generateLandMetadata, generateLandStructuredData, generateBreadcrumbStructuredData } from "@/lib/seo";
import { LandPriceCard } from "@/components/land/LandPriceCard";
import { ListingsList } from "@/components/land/ListingsList";
import { NearbyLands } from "@/components/land/NearbyLands";
import { BankValuationPanel } from "@/components/land/BankValuationPanel";
import Link from "next/link";

const PriceHistoryChart = dynamic(
  () => import("@/components/land/PriceHistoryChart").then((m) => m.PriceHistoryChart),
  { ssr: false }
);

interface Props {
  params: Promise<{ district: string; street: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district, street } = await params;
  try {
    const land = await getLandBySlug(
      decodeURIComponent(district),
      decodeURIComponent(street)
    );
    const listingsData = await getListings(land.id, 1, 5);
    return generateLandMetadata(land, listingsData?.data ?? []);
  } catch {
    return {
      title: `Giá đất ${decodeURIComponent(street)}, ${decodeURIComponent(district)}`,
    };
  }
}

export default async function LandDetailPage({ params }: Props) {
  const { district, street } = await params;
  const decodedDistrict = decodeURIComponent(district);
  const decodedStreet = decodeURIComponent(street);

  // Step 1: Fetch land by slug
  const landResult = await getLandBySlug(decodedDistrict, decodedStreet).catch(() => null);

  if (!landResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Không tìm thấy khu vực
        </h1>
        <p className="text-gray-500 mb-6">
          Tuyến đường &ldquo;{decodedStreet}&rdquo; tại &ldquo;{decodedDistrict}&rdquo; không tồn tại.
        </p>
        <Link href="/map" className="text-primary hover:underline">
          Quay về bản đồ
        </Link>
      </div>
    );
  }

  const landData = landResult;

  // Step 2: Parallel fetch with real land ID
  const [actualListings, actualHistory, actualBankSummary, actualNearby] =
    await Promise.allSettled([
      getListings(landData.id, 1, 12),
      getPriceHistory(landData.id),
      getBankValuationsForLand(landData.id),
      getNearbyLands(landData.id),
    ]);

  const listings =
    actualListings.status === "fulfilled" ? actualListings.value.data : [];
  const history =
    actualHistory.status === "fulfilled" ? actualHistory.value : null;
  const bankSummaryData =
    actualBankSummary.status === "fulfilled"
      ? actualBankSummary.value
      : null;
  const nearbyData =
    actualNearby.status === "fulfilled" ? actualNearby.value : [];

  // JSON-LD
  const landJsonLd = generateLandStructuredData(landData, listings);
  const breadcrumbJsonLd = generateBreadcrumbStructuredData([
    { name: "Trang chủ", url: "/" },
    { name: decodedDistrict, url: `/khu-vuc/${district}` },
    { name: decodedStreet, url: `/land/${district}/${street}` },
  ]);

  return (
    <>
      <Script
        id="land-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landJsonLd) }}
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
          <Link
            href={`/khu-vuc/${district}`}
            className="hover:text-primary transition-colors"
          >
            {decodedDistrict}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{decodedStreet}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price card */}
            <LandPriceCard
              land={landData}
              priceChange30d={history?.changePercent30d}
            />

            {/* Price history chart */}
            {history && <PriceHistoryChart history={history} />}

            {/* Listings */}
            <ListingsList listings={listings} title="Tin đăng trong khu vực" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini map */}
            <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <Link
                  href={`/map?lat=${landData.location.latitude}&lng=${landData.location.longitude}&zoom=16`}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm font-medium">Xem trên bản đồ</span>
                </Link>
              </div>
              <div className="p-3 text-xs text-gray-500 text-center">
                {landData.location.latitude.toFixed(4)}, {landData.location.longitude.toFixed(4)}
              </div>
            </div>

            {/* Bank valuations */}
            {bankSummaryData && (
              <BankValuationPanel summary={bankSummaryData} />
            )}

            {/* Post listing CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                Bạn có nhà/đất ở đây?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Đăng tin miễn phí để tiếp cận người mua trong khu vực này.
              </p>
              <Link
                href="/dang-tin"
                className="block text-center bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Đăng tin ngay
              </Link>
            </div>
          </div>
        </div>

        {/* Nearby lands */}
        {nearbyData.length > 0 && <NearbyLands lands={nearbyData} />}
      </div>
    </>
  );
}
