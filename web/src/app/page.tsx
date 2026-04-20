import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RealPrice — So sánh giá bất động sản theo vị trí tại Việt Nam",
  description:
    "Nền tảng so sánh giá bất động sản hàng đầu Việt Nam. Heatmap giá, định giá ngân hàng, lịch sử giá theo từng đường phố. Dữ liệu thực tế, minh bạch, cập nhật hàng ngày.",
};

const FEATURES = [
  {
    icon: "🗺️",
    title: "Heatmap giá theo khu vực",
    desc: "Xem ngay giá bất động sản theo màu nhiệt từng phường, từng đường phố. Dữ liệu được cập nhật hàng ngày từ hàng nghìn tin đăng thực tế.",
  },
  {
    icon: "🏦",
    title: "Định giá ngân hàng",
    desc: "So sánh giá thị trường với định giá của các ngân hàng lớn: Vietcombank, VietinBank, BIDV, Techcombank... Tính toán khoản vay ngay lập tức.",
  },
  {
    icon: "📊",
    title: "Lịch sử biến động giá",
    desc: "Theo dõi xu hướng giá 6 tháng gần nhất theo từng tuyến đường. Biết khi nào là thời điểm mua tốt.",
  },
  {
    icon: "⚖️",
    title: "So sánh nhiều tin cùng lúc",
    desc: "Chọn tối đa 4 bất động sản để so sánh song song: giá, diện tích, giá/m², vị trí. Tìm ra bất động sản tốt nhất dễ dàng.",
  },
  {
    icon: "📍",
    title: "Tìm kiếm theo bản đồ",
    desc: "Zoom vào đúng khu vực bạn muốn, xem tất cả bất động sản đang bán quanh đó. Không bỏ lỡ cơ hội nào.",
  },
  {
    icon: "🔔",
    title: "Cảnh báo giá",
    desc: "Đặt cảnh báo khi có bất động sản trong khu vực bạn quan tâm xuống giá hoặc có tin mới. (Pro)",
  },
];

const DISTRICTS = [
  { name: "Quận 1", city: "TP.HCM", priceLabel: "45–120 triệu/m²" },
  { name: "Quận 2", city: "TP.HCM", priceLabel: "30–80 triệu/m²" },
  { name: "Quận 7", city: "TP.HCM", priceLabel: "25–60 triệu/m²" },
  { name: "Bình Thạnh", city: "TP.HCM", priceLabel: "20–50 triệu/m²" },
  { name: "Hoàn Kiếm", city: "Hà Nội", priceLabel: "80–200 triệu/m²" },
  { name: "Đống Đa", city: "Hà Nội", priceLabel: "40–120 triệu/m²" },
  { name: "Cầu Giấy", city: "Hà Nội", priceLabel: "30–80 triệu/m²" },
  { name: "Hải Châu", city: "Đà Nẵng", priceLabel: "15–40 triệu/m²" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
            <div className="absolute inset-0 bg-gradient-to-l from-primary to-transparent" />
          </div>
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-light rounded-full px-3 py-1 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Dữ liệu cập nhật hàng ngày
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              So sánh giá{" "}
              <span className="text-primary">bất động sản</span>{" "}
              theo vị trí
            </h1>

            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Heatmap giá, định giá ngân hàng, lịch sử biến động giá theo từng đường phố.
              Tìm bất động sản giá tốt nhất tại Việt Nam.
            </p>

            {/* Search bar */}
            <form
              action="/tim-kiem"
              className="flex gap-2 max-w-lg"
            >
              <div className="flex-1 relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  name="q"
                  placeholder="Tìm theo đường, quận, khu vực..."
                  className="w-full pl-12 pr-4 py-3.5 text-gray-900 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-lg"
                />
              </div>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Quick links */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="text-xs text-gray-400">Phổ biến:</span>
              {["Quận 1", "Bình Thạnh", "Hoàn Kiếm", "Thủ Đức"].map((d) => (
                <Link
                  key={d}
                  href={`/tim-kiem?q=${encodeURIComponent(d)}`}
                  className="text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { value: "120K+", label: "Tin đăng" },
                { value: "850+", label: "Tuyến đường" },
                { value: "63", label: "Tỉnh/Thành phố" },
                { value: "15", label: "Ngân hàng" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mini map preview CTA */}
      <section className="bg-surface-secondary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-primary text-xs font-bold uppercase tracking-wider">
                Bản đồ giá
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
                Xem giá theo bản đồ, không cần lướt hàng nghìn tin
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Chế độ heatmap hiển thị mức giá theo màu sắc từng khu vực giúp bạn
                nắm bắt tổng quan thị trường ngay lập tức. Chuyển sang chế độ marker
                để xem chi tiết từng tuyến đường.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/map"
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Mở bản đồ
                </Link>
                <Link
                  href="/tim-kiem"
                  className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary text-gray-700 hover:text-primary px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Tìm kiếm nâng cao
                </Link>
              </div>
            </div>

            {/* Map preview placeholder */}
            <div className="relative h-72 rounded-2xl overflow-hidden bg-gray-200 shadow-card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-yellow-100 to-red-100 opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <Link
                    href="/map"
                    className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Xem bản đồ trực tiếp
                  </Link>
                </div>
              </div>
              {/* Fake price bubbles */}
              {[
                { top: "20%", left: "25%", price: "45 triệu" },
                { top: "40%", left: "55%", price: "62 triệu" },
                { top: "65%", left: "35%", price: "38 triệu" },
                { top: "30%", left: "70%", price: "80 triệu" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="absolute bg-white text-primary font-bold text-xs px-2 py-1 rounded-full shadow-bubble border-2 border-primary"
                  style={{ top: b.top, left: b.left }}
                >
                  {b.price}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Mọi thứ bạn cần để quyết định đúng
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Không chỉ là danh sách tin đăng — RealPrice cung cấp dữ liệu giúp bạn
              mua bán bất động sản thông minh hơn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="p-6 rounded-2xl border border-border hover:border-primary/30 hover:shadow-card transition-all group"
              >
                <div className="text-3xl mb-3">{feat.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Districts */}
      <section className="py-14 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Khu vực nổi bật</h2>
              <p className="text-sm text-gray-500 mt-1">Xem tổng quan giá theo quận/huyện</p>
            </div>
            <Link href="/tim-kiem" className="text-sm text-primary hover:underline font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DISTRICTS.map((d) => (
              <Link
                key={`${d.name}-${d.city}`}
                href={`/khu-vuc/${encodeURIComponent(d.name.toLowerCase().replace(/\s+/g, "-"))}`}
                className="bg-white rounded-2xl p-4 border border-border hover:border-primary/40 hover:shadow-card transition-all group"
              >
                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm">
                  {d.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{d.city}</p>
                <p className="text-sm font-bold text-primary mt-2">{d.priceLabel}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bạn đang có bất động sản muốn bán?
          </h2>
          <p className="text-primary-100 mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            Đăng tin miễn phí, tiếp cận hàng nghìn người mua tiềm năng.
            Tin đăng được hiển thị trên bản đồ giá ngay sau khi duyệt.
          </p>
          <Link
            href="/dang-tin"
            className="inline-flex items-center gap-2 bg-white text-primary hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-base transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đăng tin ngay — Miễn phí
          </Link>
        </div>
      </section>
    </>
  );
}
