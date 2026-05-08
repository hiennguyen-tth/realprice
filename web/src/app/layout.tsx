import type { Metadata } from "next";
import Script from "next/script";
import { getServerSession } from "next-auth";
import { Providers } from "@/components/common/Providers";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { Analytics, AdSense } from "@/components/common/Analytics";
import { generateBaseMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = generateBaseMetadata();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#FF5A1F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""} />

        {/* Verification Tags */}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}

        {/* Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "RealPrice",
              url: "https://realprice.vn",
              logo: "https://realprice.vn/logo.png",
              description: "So sánh giá bất động sản theo vị trí tại Việt Nam. Heatmap giá, định giá ngân hàng, lịch sử giá theo từng đường phố.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "VN"
              },
              sameAs: [
                "https://www.facebook.com/realprice.vn",
                "https://twitter.com/realprice",
                "https://www.instagram.com/realprice.vn"
              ]
            })
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Analytics />
        <AdSense />
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
