import type { Metadata } from "next";
import { searchListings } from "@/lib/api";
import { SearchClient } from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tìm kiếm bất động sản — RealPrice",
  description: "Tìm kiếm tin đăng bất động sản mới nhất theo khu vực, giá, diện tích và loại BĐS.",
};

interface SearchPageProps {
  searchParams?: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const initialQuery = typeof searchParams?.q === "string" ? searchParams.q : "";
  const initialResults = await searchListings(initialQuery, { sortBy: "newest" }, 1, 20).catch(() => null);

  return <SearchClient initialQuery={initialQuery} initialResults={initialResults} />;
}
