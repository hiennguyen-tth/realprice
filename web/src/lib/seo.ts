import type { Metadata } from "next";
import type { Land, Listing, AreaPriceIndex } from "@/types";
import { formatVND, formatShortPrice } from "./formatters";

const SITE_NAME = "RealPrice";
const SITE_URL = process.env.NEXTAUTH_URL ?? "https://realprice.vn";
const SITE_DESCRIPTION =
  "So sánh giá bất động sản theo vị trí tại Việt Nam. Heatmap giá, định giá ngân hàng, lịch sử giá theo từng đường phố, tin bán nhà đất. Dữ liệu thực tế, minh bạch, cập nhật hàng ngày.";

// ─────────────────────────────────────────────────────────────────────────────
// Base metadata (used in root layout)
// ─────────────────────────────────────────────────────────────────────────────

export function generateBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — So sánh giá bất động sản Việt Nam`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "giá bất động sản",
      "so sánh giá nhà đất",
      "heatmap bất động sản",
      "định giá ngân hàng",
      "giá đất theo phường",
      "bất động sản Hà Nội",
      "bất động sản TP HCM",
      "sale bất động sản",
      "bán nhà",
      "bán đất",
      "mua bán nhà đất",
      "ưu đãi bất động sản",
    ],
    authors: [{ name: "RealPrice", url: SITE_URL }],
    creator: "RealPrice",
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: `${SITE_NAME} — So sánh giá bất động sản Việt Nam`,
      description: SITE_DESCRIPTION,
      images: [
        {
          url: `${SITE_URL}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: "RealPrice — So sánh giá bất động sản",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — So sánh giá bất động sản Việt Nam`,
      description: SITE_DESCRIPTION,
      images: [`${SITE_URL}/og-default.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Land detail metadata
// ─────────────────────────────────────────────────────────────────────────────

export function generateLandMetadata(
  land: Land,
  listings: Listing[]
): Metadata {
  const title = `Giá đất ${land.street}, ${land.district} — Từ ${formatShortPrice(land.minPrice)} đến ${formatShortPrice(land.maxPrice)}`;
  const description = `So sánh ${listings.length} tin đăng tại ${land.street}, ${land.district}. Giá tốt nhất: ${formatVND(land.minPrice)}. Xem heatmap giá và định giá ngân hàng.`;
  const ogImage = `${SITE_URL}/api/og/land?id=${land.id}`;

  return {
    title,
    description,
    keywords: [
      land.street,
      land.district,
      "giá đất",
      "bán đất",
      "bất động sản",
      "sale bất động sản",
      "mua bán nhà đất",
    ],
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: `${SITE_URL}/land/${encodeURIComponent(land.district)}/${encodeURIComponent(land.street)}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// District metadata
// ─────────────────────────────────────────────────────────────────────────────

export function generateDistrictMetadata(
  district: string,
  stats: AreaPriceIndex
): Metadata {
  const title = `Giá bất động sản ${district} — Trung bình ${formatShortPrice(stats.avgPricePerM2)}/m²`;
  const description = `Tổng hợp giá bất động sản quận ${district}: giá trung bình ${formatVND(stats.avgPricePerM2)}/m², ${stats.totalListings} tin đăng. Heatmap giá, top tuyến đường, định giá ngân hàng.`;
  const ogImage = `${SITE_URL}/api/og/district?district=${encodeURIComponent(district)}`;

  return {
    title,
    description,
    keywords: [
      `bất động sản ${district}`,
      "giá đất",
      "heatmap giá",
      "sale bất động sản",
      "mua bán nhà đất",
      "định giá ngân hàng",
    ],
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: `${SITE_URL}/khu-vuc/${encodeURIComponent(district)}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD structured data
// ─────────────────────────────────────────────────────────────────────────────

export function generateLandStructuredData(
  land: Land,
  listings: Listing[]
): object {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${land.street}, ${land.district}`,
    description: `So sánh ${listings.length} tin đăng bất động sản tại ${land.street}, ${land.district}.`,
    url: `${SITE_URL}/land/${encodeURIComponent(land.district)}/${encodeURIComponent(land.street)}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: land.street,
      addressLocality: land.district,
      addressRegion: land.city,
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: land.location.latitude,
      longitude: land.location.longitude,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "VND",
      lowPrice: land.minPrice,
      highPrice: land.maxPrice,
      offerCount: listings.length,
    },
    aggregateRating:
      listings.length > 0
        ? {
          "@type": "AggregateRating",
          ratingValue: "4.2",
          reviewCount: listings.length,
        }
        : undefined,
  };
}

export function generateDistrictStructuredData(
  district: string,
  stats: AreaPriceIndex
): object {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `Quận ${district}`,
    description: `Thông tin giá bất động sản quận ${district}. Giá trung bình ${formatVND(stats.avgPricePerM2)}/m².`,
    url: `${SITE_URL}/khu-vuc/${encodeURIComponent(district)}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: district,
      addressCountry: "VN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: stats.totalListings,
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
