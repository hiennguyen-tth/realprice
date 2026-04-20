"use client";

import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { getMyListings, getSavedListings } from "@/lib/api";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingCardSkeleton } from "@/components/common/Skeleton";
import { Badge } from "@/components/common/Badge";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  const { data: myListings, isLoading: myLoading } = useQuery({
    queryKey: ["myListings"],
    queryFn: getMyListings,
    enabled: !!session,
  });

  const { data: savedListings, isLoading: savedLoading } = useQuery({
    queryKey: ["savedListings"],
    queryFn: getSavedListings,
    enabled: !!session,
  });

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto" />
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  const user = session?.user;
  const plan = (session as { accessToken?: string; user?: { plan?: string } })?.user?.plan ?? "free";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl shadow-card border border-border p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-2xl">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
              <Badge
                variant={plan === "pro" ? "primary" : plan === "enterprise" ? "info" : "default"}
              >
                {plan === "free" ? "Miễn phí" : plan === "pro" ? "Pro" : "Enterprise"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors border border-border px-3 py-1.5 rounded-lg hover:border-red-200"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Upgrade CTA (free users) */}
        {plan === "free" && (
          <div className="mt-5 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Nâng cấp lên Pro</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Đăng không giới hạn, cảnh báo giá, xem định giá ngân hàng đầy đủ.
              </p>
            </div>
            <button className="shrink-0 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Nâng cấp
            </button>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tin đăng", value: myListings?.length ?? 0, icon: "📝" },
          { label: "Đã lưu", value: savedListings?.length ?? 0, icon: "🔖" },
          { label: "Lượt xem", value: "—", icon: "👁️" },
          { label: "Liên hệ", value: "—", icon: "📞" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-border p-4 text-center shadow-card"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* My listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Tin đăng của tôi</h2>
          <Link
            href="/dang-tin"
            className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin mới
          </Link>
        </div>

        {myLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : myListings?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <p className="text-gray-500 mb-4 text-sm">Bạn chưa có tin đăng nào</p>
            <Link
              href="/dang-tin"
              className="inline-block bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Đăng tin đầu tiên
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Saved listings */}
      {(savedListings?.length ?? 0) > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tin đã lưu</h2>
          {savedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedListings?.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
