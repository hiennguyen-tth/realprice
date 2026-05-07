import type { Metadata } from "next";
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FF5A1F" />
        <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? ""} />
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
