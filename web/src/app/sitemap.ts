import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://realprice.vn";

const DISTRICTS = [
  "quan-1", "quan-2", "quan-7", "binh-thanh", "thu-duc", "go-vap",
  "hoan-kiem", "dong-da", "cau-giay", "long-bien", "ha-dong",
  "hai-chau", "son-tra", "ngu-hanh-son", "lien-chieu", "thanh-khe",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const districtUrls = DISTRICTS.map((slug) => ({
    url: `${SITE_URL}/khu-vuc/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/map`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tim-kiem`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/so-sanh`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/dang-tin`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/khu-vuc`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/huong-dan`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/hoi-dap`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/lien-he`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    ...districtUrls,
  ];
}
