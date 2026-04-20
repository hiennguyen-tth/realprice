import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://realprice.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/tai-khoan/", "/dang-tin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
