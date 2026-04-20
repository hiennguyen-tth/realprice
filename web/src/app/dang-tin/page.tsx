import type { Metadata } from "next";
import { PostListingWizard } from "@/components/postListing/PostListingWizard";

export const metadata: Metadata = {
  title: "Đăng tin bán bất động sản",
  description:
    "Đăng tin bán bất động sản miễn phí trên RealPrice. Tiếp cận hàng nghìn người mua tiềm năng. Hiển thị trực tiếp trên bản đồ giá.",
  robots: { index: false },
};

export default function PostListingPage() {
  return <PostListingWizard />;
}
