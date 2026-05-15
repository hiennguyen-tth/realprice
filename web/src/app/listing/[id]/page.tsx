import type { Metadata } from "next";
import { getListingById } from "@/lib/api";
import { ListingDetailView } from "@/components/listing/ListingDetailView";
import { CompareTray } from "@/components/comparison/CompareTray";
import Link from "next/link";
import { generateBreadcrumbStructuredData, generateListingMetadata, generateListingStructuredData } from "@/lib/seo";
import { slugifyVietnamese } from "@/lib/slugs";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getListingById(params.id);
    return generateListingMetadata(listing);
  } catch {
    return {
      title: "Không tìm thấy tin đăng",
      description: "Tin đăng này đã bị xóa hoặc không còn khả dụng trên RealPrice.",
      robots: { index: false, follow: true },
    };
  }
}

export default async function ListingPage({ params }: Props) {
  const listing = await getListingById(params.id).catch(() => null);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Không tìm thấy tin đăng
        </h1>
        <p className="text-gray-500 mb-6">
          Tin đăng này đã bị xóa hoặc không tồn tại.
        </p>
        <Link href="/tim-kiem" className="text-primary hover:underline font-medium">
          Tìm bất động sản khác
        </Link>
      </div>
    );
  }

  const district = listing.district || listing.land?.district || "";
  const districtSlug = district ? slugifyVietnamese(district) : "";
  const listingJsonLd = generateListingStructuredData(listing);
  const breadcrumbJsonLd = generateBreadcrumbStructuredData([
    { name: "Trang chủ", url: "/" },
    ...(districtSlug ? [{ name: district, url: `/khu-vuc/${districtSlug}` }] : []),
    { name: listing.title, url: `/listing/${listing.id}` },
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <script
        id="listing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />
      <script
        id="listing-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
        <span>›</span>
        {district && districtSlug && (
          <>
            <Link href={`/khu-vuc/${districtSlug}`} className="hover:text-primary transition-colors">
              {district}
            </Link>
            <span>›</span>
          </>
        )}
        <span className="text-gray-900 truncate max-w-xs">{listing.title}</span>
      </nav>

      <ListingDetailView listing={listing} />
      <CompareTray />
    </div>
  );
}
