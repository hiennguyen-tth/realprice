import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — RealPrice",
  description:
    "Điều khoản sử dụng RealPrice cho người dùng đăng tin, tìm kiếm và so sánh bất động sản trên nền tảng.",
  keywords: "điều khoản sử dụng, điều khoản RealPrice, bất động sản, đăng tin bán nhà, quảng cáo bất động sản",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Điều khoản sử dụng</h1>
      <p className="text-gray-400 text-sm mb-8">Cập nhật lần cuối: 15/05/2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Chấp nhận điều khoản</h2>
          <p>Khi sử dụng RealPrice, bạn đồng ý tuân theo các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Mô tả dịch vụ</h2>
          <p>RealPrice là nền tảng cung cấp thông tin so sánh giá bất động sản. Chúng tôi tổng hợp dữ liệu từ nhiều nguồn để hỗ trợ quyết định mua bán, không phải là đơn vị môi giới.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Quy định đăng tin</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Thông tin phải chính xác, trung thực</li>
            <li>Không đăng tin giả, lừa đảo hoặc vi phạm pháp luật</li>
            <li>Một bất động sản không được đăng trùng lặp nhiều lần</li>
            <li>Ảnh phải là ảnh thực của bất động sản</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Giới hạn trách nhiệm</h2>
          <p>RealPrice cung cấp thông tin tham khảo. Chúng tôi không chịu trách nhiệm về tính chính xác tuyệt đối của giá cả hay về kết quả giao dịch giữa các bên.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Quyền sở hữu trí tuệ</h2>
          <p>Toàn bộ nội dung, thiết kế, mã nguồn thuộc sở hữu của RealPrice. Không được sao chép, phân phối khi chưa có sự đồng ý bằng văn bản.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Chấm dứt tài khoản</h2>
          <p>Chúng tôi có quyền tạm dừng hoặc xóa tài khoản vi phạm điều khoản mà không cần báo trước.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">7. Liên hệ</h2>
          <p>Mọi thắc mắc liên quan đến điều khoản sử dụng, vui lòng liên hệ: <a href="mailto:legal@realprice.vn" className="text-primary hover:underline">legal@realprice.vn</a></p>
        </section>
      </div>
    </div>
  );
}
