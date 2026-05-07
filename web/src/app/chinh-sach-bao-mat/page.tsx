import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — RealPrice",
  description:
    "Chính sách bảo mật RealPrice đảm bảo dữ liệu người dùng và thông tin tin đăng bất động sản được bảo vệ an toàn.",
  keywords: "chính sách bảo mật, bảo mật dữ liệu, bất động sản, RealPrice, ads bất động sản",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Chính sách bảo mật</h1>
      <p className="text-gray-400 text-sm mb-8">Cập nhật lần cuối: 01/01/2025</p>

      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Thông tin chúng tôi thu thập</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Thông tin đăng ký: số điện thoại, email, tên</li>
            <li>Dữ liệu sử dụng: trang xem, tìm kiếm, bộ lọc đã áp dụng</li>
            <li>Vị trí (khi bạn cho phép): để hiển thị bất động sản gần bạn</li>
            <li>Cookies: duy trì phiên đăng nhập và tùy chỉnh giao diện</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">2. Mục đích sử dụng</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cung cấp và cải thiện dịch vụ</li>
            <li>Gửi thông báo về tin đăng, giá cả (nếu bạn đăng ký)</li>
            <li>Phân tích dữ liệu để cải thiện trải nghiệm người dùng</li>
            <li>Bảo mật và phòng chống gian lận</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">3. Chia sẻ thông tin</h2>
          <p>Chúng tôi KHÔNG bán dữ liệu cá nhân. Thông tin chỉ được chia sẻ với:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Đối tác dịch vụ (hosting, SMS, phân tích) theo hợp đồng bảo mật</li>
            <li>Cơ quan pháp luật khi có yêu cầu hợp pháp</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">4. Quyền của bạn</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Xem và chỉnh sửa thông tin tài khoản</li>
            <li>Yêu cầu xóa tài khoản và dữ liệu</li>
            <li>Hủy đăng ký nhận thông báo bất cứ lúc nào</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">5. Bảo mật dữ liệu</h2>
          <p>Dữ liệu được mã hóa bằng HTTPS. Mật khẩu được hash với bcrypt. Chúng tôi thực hiện các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ thông tin.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-2">6. Liên hệ</h2>
          <p>Mọi yêu cầu về quyền riêng tư: <a href="mailto:privacy@realprice.vn" className="text-primary hover:underline">privacy@realprice.vn</a></p>
        </section>
      </div>
    </div>
  );
}
