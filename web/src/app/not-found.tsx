import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-extrabold text-primary">404</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Trang không tồn tại
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          Thử tìm kiếm bất động sản theo khu vực khác.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Về trang chủ
          </Link>
          <Link
            href="/map"
            className="border-2 border-border hover:border-primary text-gray-700 hover:text-primary px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Bản đồ giá
          </Link>
        </div>
      </div>
    </div>
  );
}
