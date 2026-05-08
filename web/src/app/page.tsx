import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RealPrice — So sánh giá bất động sản theo vị trí tại Việt Nam",
  description:
    "Nền tảng so sánh giá bất động sản hàng đầu Việt Nam. Heatmap giá, định giá ngân hàng, lịch sử giá theo từng đường phố. Dữ liệu thực tế, minh bạch, cập nhật hàng ngày.",
  keywords: "bất động sản, giá nhà đất, heatmap giá, định giá ngân hàng, mua bán nhà, sale nhà, sale đất, khuyến mãi bất động sản, ưu đãi bán đất",
  openGraph: {
    title: "RealPrice — So sánh giá bất động sản theo vị trí",
    description: "Heatmap giá, định giá ngân hàng, lịch sử biến động giá theo từng đường phố tại Việt Nam.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: "Heatmap giá theo khu vực",
    desc: "Xem ngay giá bất động sản theo màu nhiệt từng phường, từng đường phố. Dữ liệu cập nhật hàng ngày từ hàng nghìn tin đăng thực tế.",
    href: "/map",
    cta: "Xem bản đồ",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Định giá ngân hàng",
    desc: "So sánh giá thị trường với định giá của các ngân hàng lớn: Vietcombank, VietinBank, BIDV, Techcombank... Tính toán khoản vay ngay lập tức.",
    href: "/khu-vuc",
    cta: "Xem khu vực",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Lịch sử biến động giá",
    desc: "Theo dõi xu hướng giá 6 tháng gần nhất theo từng tuyến đường. Biết khi nào là thời điểm mua tốt.",
    href: "/map",
    cta: "Khám phá",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "So sánh nhiều tin cùng lúc",
    desc: "Chọn tối đa 4 bất động sản để so sánh song song: giá, diện tích, giá/m², vị trí. Tìm ra bất động sản tốt nhất dễ dàng.",
    href: "/so-sanh",
    cta: "So sánh ngay",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: "Tìm kiếm theo bản đồ",
    desc: "Zoom vào đúng khu vực bạn muốn, xem tất cả bất động sản đang bán quanh đó. Không bỏ lỡ cơ hội nào.",
    href: "/tim-kiem",
    cta: "Tìm kiếm",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    title: "Cảnh báo giá",
    desc: "Đặt cảnh báo khi có bất động sản trong khu vực bạn quan tâm xuống giá hoặc có tin mới. Nâng cấp lên Pro để sử dụng.",
    href: "/dang-ky",
    cta: "Đăng ký Pro",
  },
];

const DISTRICTS = [
  { name: "Quận 1", city: "TP.HCM", priceLabel: "45–120 triệu/m²", slug: "quan-1" },
  { name: "Quận 2", city: "TP.HCM", priceLabel: "30–80 triệu/m²", slug: "quan-2" },
  { name: "Quận 7", city: "TP.HCM", priceLabel: "25–60 triệu/m²", slug: "quan-7" },
  { name: "Bình Thạnh", city: "TP.HCM", priceLabel: "20–50 triệu/m²", slug: "binh-thanh" },
  { name: "Hoàn Kiếm", city: "Hà Nội", priceLabel: "80–200 triệu/m²", slug: "hoan-kiem" },
  { name: "Đống Đa", city: "Hà Nội", priceLabel: "40–120 triệu/m²", slug: "dong-da" },
  { name: "Cầu Giấy", city: "Hà Nội", priceLabel: "30–80 triệu/m²", slug: "cau-giay" },
  { name: "Hải Châu", city: "Đà Nẵng", priceLabel: "15–40 triệu/m²", slug: "hai-chau" },
];

const STATS = [
  { value: "120K+", label: "Tin đăng" },
  { value: "850+", label: "Tuyến đường" },
  { value: "63", label: "Tỉnh/Thành phố" },
  { value: "15", label: "Ngân hàng" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Accent glow */}
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none">
          <div className="absolute top-1/4 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-32 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:pt-28 lg:pb-16">
          <div className="max-w-2xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 text-orange-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Dữ liệu cập nhật hàng ngày
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
              So sánh giá{" "}
              <span className="text-primary">bất động sản</span>{" "}
              theo vị trí
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-xl">
              Heatmap giá, định giá ngân hàng, lịch sử biến động giá theo từng
              đường phố. Tìm bất động sản giá tốt nhất tại Việt Nam.
            </p>

            {/* Search bar */}
            <form action="/tim-kiem" className="flex gap-2 max-w-lg">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="VD: Nguyễn Trãi Quận 1, chung cư Bình Thạnh..."
                  autoComplete="off"
                  className="w-full pl-11 pr-4 py-3.5 text-gray-900 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-lg placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark active:scale-95 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Quick searches */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-gray-500">Phổ biến:</span>
              {["Quận 1", "Bình Thạnh", "Hoàn Kiếm", "Thủ Đức"].map((d) => (
                <Link
                  key={d}
                  href={`/tim-kiem?q=${encodeURIComponent(d)}`}
                  className="text-xs text-gray-400 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1 rounded-full transition-colors"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/8 bg-black/25">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Map CTA ──────────────────────────────────────────────────── */}
      <section className="bg-surface-secondary py-16" aria-label="Bản đồ giá">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary text-xs font-bold uppercase tracking-widest">
                Bản đồ giá thực tế
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
                Xem giá theo bản đồ,<br />
                không cần lướt hàng nghìn tin
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Chế độ heatmap hiển thị mức giá theo màu sắc từng khu vực giúp
                bạn nắm bắt tổng quan thị trường ngay lập tức. Chuyển sang chế
                độ marker để xem chi tiết từng tuyến đường.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/map"
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md shadow-primary/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Mở bản đồ giá
                </Link>
                <Link
                  href="/tim-kiem"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary text-gray-700 hover:text-primary px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Tìm kiếm nâng cao
                </Link>
              </div>
            </div>

            {/* Map preview */}
            <div className="relative h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-orange-50 shadow-card-hover border border-border">
              <div className="absolute inset-0 opacity-40"
                style={{ background: "radial-gradient(ellipse at 30% 40%, #22c55e55 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, #ef444455 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, #eab30855 0%, transparent 50%)" }}
              />
              {/* Price bubbles */}
              {[
                { top: "18%", left: "22%", price: "45 tr", color: "border-green-500 text-green-700 bg-white" },
                { top: "38%", left: "52%", price: "62 tr", color: "border-primary text-primary bg-white" },
                { top: "62%", left: "32%", price: "38 tr", color: "border-green-400 text-green-600 bg-white" },
                { top: "25%", left: "68%", price: "80 tr", color: "border-red-400 text-red-600 bg-white" },
                { top: "55%", left: "72%", price: "55 tr", color: "border-yellow-500 text-yellow-700 bg-white" },
              ].map((b, i) => (
                <div
                  key={i}
                  className={`absolute ${b.color} font-bold text-xs px-2.5 py-1 rounded-full shadow-md border-2 animate-fade-in`}
                  style={{ top: b.top, left: b.left }}
                >
                  {b.price}
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <Link
                  href="/map"
                  className="bg-white/90 backdrop-blur-sm text-primary border-2 border-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                  Xem bản đồ trực tiếp →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white" aria-label="Tính năng">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Tính năng</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-3">
              Mọi thứ bạn cần để quyết định đúng
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Không chỉ là danh sách tin đăng — RealPrice cung cấp dữ liệu
              giúp bạn mua bán bất động sản thông minh hơn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => (
              <Link
                key={feat.title}
                href={feat.href}
                className="group p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-card-hover bg-white transition-all duration-200"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  {feat.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{feat.desc}</p>
                <span className="text-xs font-semibold text-primary group-hover:underline">
                  {feat.cta} →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Districts ─────────────────────────────────────────────────── */}
      <section className="py-14 bg-surface-secondary" aria-label="Khu vực nổi bật">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Khu vực nổi bật</h2>
              <p className="text-sm text-gray-500 mt-1">Xem tổng quan giá theo quận/huyện</p>
            </div>
            <Link href="/khu-vuc" className="text-sm text-primary hover:underline font-semibold">
              Xem tất cả →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DISTRICTS.map((d) => (
              <Link
                key={d.slug}
                href={`/khu-vuc/${d.slug}`}
                className="group bg-white rounded-2xl p-4 border border-border hover:border-primary/40 hover:shadow-card transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                      {d.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.city}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-primary">{d.priceLabel}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-16 bg-white" aria-label="Cách hoạt động">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Cách dùng</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Tìm giá tốt nhất chỉ trong 3 bước
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Tìm khu vực",
                desc: "Nhập tên đường, quận hoặc mở bản đồ để chọn khu vực bạn quan tâm.",
                href: "/map",
                cta: "Mở bản đồ",
              },
              {
                step: "02",
                title: "Xem phân tích giá",
                desc: "Xem heatmap giá, lịch sử biến động, và định giá ngân hàng cho khu vực đó.",
                href: "/tim-kiem",
                cta: "Tìm kiếm",
              },
              {
                step: "03",
                title: "So sánh & quyết định",
                desc: "Chọn tối đa 4 bất động sản để so sánh chi tiết và tìm ra lựa chọn tốt nhất.",
                href: "/so-sanh",
                cta: "So sánh ngay",
              },
            ].map((s) => (
              <div key={s.step} className="relative p-6 rounded-2xl border border-border bg-surface-secondary hover:shadow-card transition-all group">
                <div className="text-4xl font-black text-primary/10 mb-4 select-none">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{s.desc}</p>
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  {s.cta}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA: Post listing ─────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white" aria-label="Đăng tin">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-orange-300 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
            Miễn phí 100%
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Bạn đang có bất động sản muốn bán?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed max-w-xl mx-auto">
            Đăng tin miễn phí, tiếp cận hàng nghìn người mua tiềm năng.
            Tin đăng được hiển thị trên bản đồ giá ngay sau khi duyệt.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dang-tin"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-xl shadow-primary/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Đăng tin ngay — Miễn phí
            </Link>
            <Link
              href="/huong-dan"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-6 py-4 rounded-xl font-semibold text-base transition-all"
            >
              Xem hướng dẫn
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
