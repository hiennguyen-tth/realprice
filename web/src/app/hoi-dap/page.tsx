import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Câu hỏi thường gặp",
  description: "Giải đáp các thắc mắc phổ biến về RealPrice: cách xem giá, đăng tin, so sánh bất động sản.",
  keywords: "faq RealPrice, câu hỏi bất động sản, hướng dẫn đăng tin, hướng dẫn so sánh bất động sản, sale nhà đất, tiếp cận khách mua",
};

const FAQS = [
  {
    q: "RealPrice là gì?",
    a: "RealPrice là nền tảng so sánh giá bất động sản tại Việt Nam. Chúng tôi tổng hợp dữ liệu tin đăng thực tế để giúp người mua, người bán có cái nhìn minh bạch về thị trường.",
  },
  {
    q: "Dữ liệu giá có chính xác không?",
    a: "Dữ liệu được tổng hợp từ tin đăng thực tế và cập nhật hàng ngày. Tuy nhiên, giá thực tế có thể thay đổi tùy thương lượng. Chúng tôi khuyến khích bạn liên hệ trực tiếp với chủ nhà để có giá chính xác nhất.",
  },
  {
    q: "Làm thế nào để đăng tin bất động sản?",
    a: "Nhấn vào nút 'Đăng tin' ở góc trên phải. Điền thông tin địa chỉ, giá, diện tích và ảnh. Tin đăng sẽ được duyệt trong vòng 24 giờ và hiển thị trên bản đồ.",
  },
  {
    q: "Heatmap giá là gì?",
    a: "Heatmap giá hiển thị mức giá bất động sản theo màu sắc trên bản đồ: xanh (rẻ) → vàng → đỏ (đắt). Giúp bạn nắm tổng quan thị trường khu vực nhanh chóng.",
  },
  {
    q: "Tôi có thể so sánh nhiều bất động sản cùng lúc không?",
    a: "Có! Nhấn nút 'So sánh' trên mỗi tin đăng (tối đa 4 tin). Sau đó vào trang So sánh để xem bảng so sánh chi tiết về giá, diện tích, giá/m².",
  },
  {
    q: "Định giá ngân hàng là gì?",
    a: "Các ngân hàng lớn (Vietcombank, BIDV, Techcombank...) có bảng định giá riêng cho từng khu vực để xét duyệt khoản vay. RealPrice hiển thị thông tin này để bạn biết ngân hàng sẽ cho vay tối đa bao nhiêu.",
  },
  {
    q: "Đăng tin có mất phí không?",
    a: "Đăng tin cơ bản hoàn toàn MIỄN PHÍ. Chúng tôi có gói 'Boost tin' (3/7/30 ngày) để tin của bạn xuất hiện nổi bật hơn trên bản đồ.",
  },
  {
    q: "Làm sao để báo cáo tin đăng sai?",
    a: "Vào trang chi tiết tin đăng, nhấn nút 'Báo cáo' hoặc liên hệ trực tiếp qua trang Liên hệ của chúng tôi.",
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Câu hỏi thường gặp</h1>
        <p className="text-gray-500 mt-2">
          Không tìm thấy câu trả lời?{" "}
          <Link href="/lien-he" className="text-primary hover:underline">
            Liên hệ với chúng tôi
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <details
            key={i}
            className="group bg-white rounded-2xl border border-border shadow-card overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none">
              <span className="font-semibold text-gray-900 group-open:text-primary transition-colors">
                {faq.q}
              </span>
              <svg
                className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
        <h2 className="font-bold text-gray-900 mb-2">Vẫn còn thắc mắc?</h2>
        <p className="text-sm text-gray-500 mb-4">Đội ngũ hỗ trợ của chúng tôi sẵn sàng giúp đỡ bạn.</p>
        <Link
          href="/lien-he"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Liên hệ ngay
        </Link>
      </div>
    </div>
  );
}
