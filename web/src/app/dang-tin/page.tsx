import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
    redirect("/dang-nhap?redirect=/dang-tin");
  }
  return <PostListingWizard />;
}
