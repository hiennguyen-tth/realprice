import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng — RealPrice",
  description: "Hướng dẫn chi tiết cách sử dụng RealPrice: xem bản đồ giá, đăng tin, so sánh bất động sản.",
};

const GUIDES = [
  {
    icon: "🗺️",
    title: "Xem bản đồ giá",
    steps: [
      "Vào trang Bản đồ giá",
      "Chọn khu vực muốn xem bằng cách kéo/zoom bản đồ",
      "Bật chế độ Heatmap để xem giá theo màu sắc",
      "Nhấn vào bong bóng giá để xem chi tiết vị trí",
      "Dùng bộ lọc để lọc theo loại BĐS, khoảng giá",
    ],
    link: "/map",
    linkText: "Mở bản đồ",
  },
  {
    icon: "🔍",
    title: "Tìm kiếm bất động sản",
    steps: [
      "Nhập tên đường, quận, khu vực vào ô tìm kiếm",
      "Lọc kết quả theo loại BĐS (đất nền, nhà phố, chung cư...)",
      "Lọc theo khoảng giá và diện tích",
      "Sắp xếp theo giá tăng/giảm, mới nhất",
      "Nhấn vào tin đăng để xem chi tiết",
    ],
    link: "/tim-kiem",
    linkText: "Bắt đầu tìm kiếm",
  },
  {
    icon: "⚖️",
    title: "So sánh bất động sản",
    steps: [
      "Tìm 2–4 tin đăng bạn muốn so sánh",
      "Nhấn nút 'So sánh' trên mỗi tin đăng",
      "Tin được thêm vào khay so sánh ở dưới màn hình",
      "Nhấn 'So sánh ngay' để xem bảng so sánh chi tiết",
      "Xem phân tích: tin nào rẻ nhất, giá/m² tốt nhất",
    ],
    link: "/so-sanh",
    linkText: "Xem hướng dẫn so sánh",
  },
  {
    icon: "📝",
    title: "Đăng tin bất động sản",
    steps: [
      "Nhấn 'Đăng tin' ở góc trên phải",
      "Đăng nhập hoặc đăng ký tài khoản",
      "Điền thông tin địa chỉ (chọn trên bản đồ)",
      "Nhập giá, diện tích, loại bất động sản",
      "Tải ảnh lên (tối đa 10 ảnh)",
      "Xem lại và gửi duyệt — tin sẽ được duyệt trong 24 giờ",
    ],
    link: "/dang-tin",
    linkText: "Đăng tin ngay",
  },
];

export default function HuongDanPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Hướng dẫn sử dụng</h1>
        <p className="text-gray-500 mt-2">Làm quen với RealPrice trong vài phút.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GUIDES.map((guide) => (
          <div
            key={guide.title}
            className="bg-white rounded-2xl border border-border shadow-card p-6 hover:shadow-card-hover hover:border-primary/20 transition-all"
          >
            <div className="text-4xl mb-3">{guide.icon}</div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{guide.title}</h2>
            <ol className="space-y-2 mb-5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <Link
              href={guide.link}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              {guide.linkText} →
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm mb-3">Còn thắc mắc?</p>
        <Link
          href="/hoi-dap"
          className="inline-flex items-center gap-2 border-2 border-primary text-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
        >
          Xem câu hỏi thường gặp
        </Link>
      </div>
    </div>
  );
}
