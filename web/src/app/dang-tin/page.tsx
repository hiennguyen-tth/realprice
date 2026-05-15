import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { PostListingWizard } from "@/components/postListing/PostListingWizard";

export const metadata: Metadata = {
  title: "Đăng tin bán bất động sản",
  description:
    "Đăng tin bán bất động sản miễn phí trên RealPrice. Tiếp cận hàng nghìn người mua tiềm năng. Hiển thị trực tiếp trên bản đồ giá.",
  keywords: "đăng tin bất động sản, đăng tin bán nhà, đăng tin bán đất, sale nhà, sale đất, quảng cáo bất động sản, tiếp cận người mua",
};

export default async function PostListingPage() {
  const session = await getServerSession();
  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-primary mb-3">Đăng tin RealPrice</p>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              Đăng tin bất động sản có dữ liệu giá khu vực đi kèm
            </h1>
            <p className="text-gray-500 mt-3">
              Tin đăng được gắn vị trí trên bản đồ giá, hỗ trợ người mua so sánh giá/m² và liên hệ nhanh hơn.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: "Miễn phí", body: "Không thu phí đăng tin cơ bản." },
                { title: "Duyệt trong 24h", body: "Tin hợp lệ được kiểm tra trước khi hiển thị." },
                { title: "Tối đa 10 ảnh", body: "Ảnh rõ mặt tiền, pháp lý và hiện trạng giúp tăng niềm tin." },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-border p-4 shadow-card">
                  <h2 className="font-semibold text-gray-900 text-sm">{item.title}</h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Quy trình đăng tin</h2>
            <ol className="space-y-4 list-none">
              {[
                "Đăng nhập hoặc tạo tài khoản miễn phí.",
                "Chọn vị trí, nhập giá, diện tích và loại bất động sản.",
                "Tải ảnh, kiểm tra bản xem trước và gửi duyệt.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/dang-nhap?redirect=/dang-tin"
              className="mt-6 block text-center bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Đăng nhập để bắt đầu
            </Link>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Bằng cách đăng tin, bạn đồng ý với quy định kiểm duyệt và chính sách dữ liệu của RealPrice.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return <PostListingWizard />;
}
