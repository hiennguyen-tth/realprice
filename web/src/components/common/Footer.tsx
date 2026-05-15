import Link from "next/link";
import { getDistrictSummaries } from "@/lib/api";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const exploreLinks = [
    { href: "/map", label: "Bản đồ giá" },
    { href: "/tim-kiem", label: "Tìm kiếm" },
    { href: "/so-sanh", label: "So sánh giá" },
    { href: "/dang-tin", label: "Đăng tin" },
    { href: "/khu-vuc", label: "Khu vực" },
  ];
  const supportLinks = [
    { href: "/huong-dan", label: "Hướng dẫn" },
    { href: "/hoi-dap", label: "Hỏi đáp" },
    { href: "/lien-he", label: "Liên hệ" },
    { href: "/lien-he?subject=bug#bao-loi", label: "Báo lỗi" },
    { href: "/lien-he?subject=partner#doi-tac", label: "Đối tác" },
  ];
  const districts = await getDistrictSummaries(8).catch(() => []);

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-7 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RP</span>
              </div>
              <span className="text-xl font-bold text-white">
                Real<span className="text-primary">Price</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              So sánh giá bất động sản theo vị trí. Dữ liệu thực tế, cập nhật
              hàng ngày.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.facebook.com/realprice.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook RealPrice"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@realprice-vn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="YouTube RealPrice"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="black" />
                </svg>
              </a>
              <a
                href="mailto:support@realprice.vn"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Email hỗ trợ RealPrice"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links: Khám phá */}
          <div>
            <h3 className="text-white font-semibold mb-3 md:mb-4">Khám phá</h3>
            <ul className="space-y-2 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Hỗ trợ */}
          <div>
            <h3 className="text-white font-semibold mb-3 md:mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Khu vực nổi bật */}
          {districts.length > 0 ? (
            <div className="hidden md:block">
              <h3 className="text-white font-semibold mb-4">Khu vực nổi bật</h3>
              <ul className="space-y-2 text-sm">
                {districts.map((district) => (
                  <li key={district.slug}>
                    <Link
                      href={`/khu-vuc/${district.slug}`}
                      className="hover:text-white transition-colors"
                    >
                      {district.district}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="hidden md:block">
              <h3 className="text-white font-semibold mb-4">Khu vực</h3>
              <Link href="/khu-vuc" className="text-sm hover:text-white transition-colors">
                Xem khu vực có dữ liệu
              </Link>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-7 md:mt-10 pt-5 md:pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs md:text-sm text-gray-500">
          <p>© {currentYear} RealPrice. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/dieu-khoan" className="hover:text-gray-300 transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/chinh-sach-bao-mat" className="hover:text-gray-300 transition-colors">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
