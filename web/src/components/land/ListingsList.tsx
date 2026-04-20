import { ListingCard } from "@/components/listing/ListingCard";
import type { Listing } from "@/types";

interface ListingsListProps {
  listings: Listing[];
  title?: string;
}

export function ListingsList({ listings, title = "Tin đăng" }: ListingsListProps) {
  if (!listings.length) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-border p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Chưa có tin đăng nào</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {title}{" "}
        <span className="text-sm font-normal text-gray-500">
          ({listings.length} tin)
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
