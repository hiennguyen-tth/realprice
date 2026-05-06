import type { Metadata } from "next";
import Link from "next/link";
import { getDistrictSummaries } from "@/lib/api";
import { formatPricePerM2 } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Khu vực bất động sản — RealPrice",
  description: "Xem giá bất động sản theo khu vực, quận huyện tại TP.HCM, Hà Nội, Đà Nẵng. Heatmap giá, định giá ngân hàng.",
};

const DEFAULT_CITIES = [
  {
    name: "TP. Hồ Chí Minh",
    districts: [
      { name: "Quận 1", slug: "quan-1", price: "45–120 triệu/m²", tag: "hot" },
      { name: "Quận 2", slug: "quan-2", price: "30–80 triệu/m²" },
      { name: "Quận 7", slug: "quan-7", price: "25–60 triệu/m²" },
      { name: "Bình Thạnh", slug: "binh-thanh", price: "20–50 triệu/m²" },
      { name: "Thủ Đức", slug: "thu-duc", price: "18–45 triệu/m²" },
      { name: "Gò Vấp", slug: "go-vap", price: "15–35 triệu/m²" },
    ],
  },
  {
    name: "Hà Nội",
    districts: [
      { name: "Hoàn Kiếm", slug: "hoan-kiem", price: "80–200 triệu/m²", tag: "hot" },
      { name: "Đống Đa", slug: "dong-da", price: "40–120 triệu/m²" },
      { name: "Cầu Giấy", slug: "cau-giay", price: "30–80 triệu/m²" },
      { name: "Long Biên", slug: "long-bien", price: "20–50 triệu/m²" },
      { name: "Hà Đông", slug: "ha-dong", price: "18–40 triệu/m²" },
    ],
  },
  {
    name: "Đà Nẵng",
    districts: [
      { name: "Hải Châu", slug: "hai-chau", price: "25–60 triệu/m²", tag: "hot" },
      { name: "Sơn Trà", slug: "son-tra", price: "20–50 triệu/m²" },
      { name: "Ngũ Hành Sơn", slug: "ngu-hanh-son", price: "15–40 triệu/m²" },
      { name: "Liên Chiểu", slug: "lien-chieu", price: "10–25 triệu/m²" },
      { name: "Thanh Khê", slug: "thanh-khe", price: "18–45 triệu/m²" },
    ],
  },
];

interface DistrictSummary {
  district: string;
  province: string;
  slug: string;
  avgPricePerM2: number;
  minPricePerM2: number;
  maxPricePerM2: number;
  totalListings: number;
  tag?: string;
}

interface CitySummary {
  name: string;
  districts: Array<{
    name: string;
    slug: string;
    price: string;
    totalListings?: number;
    tag?: string;
  }>;
}

export default async function KhuVucPage() {
  let districts: DistrictSummary[] = [];

  try {
    districts = await getDistrictSummaries(30);
  } catch {
    districts = [];
  }

  const groupedByProvince = districts.length
    ? districts.reduce((acc, item) => {
      const province = item.province || "TP.HCM";
      if (!acc[province]) acc[province] = [];
      acc[province].push(item);
      return acc;
    }, {} as Record<string, DistrictSummary[]>)
    : {};

  const cities: CitySummary[] = districts.length
    ? Object.entries(groupedByProvince).map(([province, list]) => ({
      name: province,
      districts: list.map((item) => ({
        name: item.district,
        slug: item.slug,
        price: `${formatPricePerM2(item.minPricePerM2)}–${formatPricePerM2(item.maxPricePerM2)}`,
        totalListings: item.totalListings,
      })),
    }))
    : DEFAULT_CITIES;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Khu vực bất động sản</h1>
        <p className="text-gray-500 mt-2">
          Chọn quận/huyện để xem heatmap giá, lịch sử biến động và định giá ngân hàng.
        </p>
      </div>

      <div className="flex gap-3 mb-10">
        <Link
          href="/map"
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Xem trên bản đồ
        </Link>
        <Link
          href="/tim-kiem"
          className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
        >
          Tìm kiếm nâng cao
        </Link>
      </div>

      <div className="space-y-10">
        {cities.map((city) => (
          <section key={city.name}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              {city.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {city.districts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/khu-vuc/${d.slug}`}
                  className="group bg-white rounded-2xl p-4 border border-border hover:border-primary/40 hover:shadow-card transition-all relative"
                >
                  {d.tag === "hot" && (
                    <span className="absolute top-3 right-3 text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                      HOT
                    </span>
                  )}
                  <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                    {d.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{city.name}</p>
                  <p className="text-sm font-bold text-primary mt-2">{d.price}</p>
                  {d.totalListings != null && (
                    <p className="text-xs text-gray-400 mt-1">
                      {d.totalListings.toLocaleString("vi-VN")} tin đăng
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Xem heatmap →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
