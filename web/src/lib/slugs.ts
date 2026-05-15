const DISTRICT_SLUG_MAP: Record<string, string> = {
  "quan-1": "Quận 1",
  "quan-2": "Quận 2",
  "quan-3": "Quận 3",
  "quan-4": "Quận 4",
  "quan-5": "Quận 5",
  "quan-6": "Quận 6",
  "quan-7": "Quận 7",
  "quan-8": "Quận 8",
  "quan-9": "Quận 9",
  "quan-10": "Quận 10",
  "quan-11": "Quận 11",
  "quan-12": "Quận 12",
  "binh-thanh": "Bình Thạnh",
  "binh-tan": "Bình Tân",
  "binh-chanh": "Bình Chánh",
  "go-vap": "Gò Vấp",
  "tan-binh": "Tân Bình",
  "tan-phu": "Tân Phú",
  "phu-nhuan": "Phú Nhuận",
  "thu-duc": "Thủ Đức",
  "nha-be": "Nhà Bè",
  "hoc-mon": "Hóc Môn",
  "cu-chi": "Củ Chi",
  "can-gio": "Cần Giờ",
  "hoan-kiem": "Hoàn Kiếm",
  "ba-dinh": "Ba Đình",
  "dong-da": "Đống Đa",
  "hai-ba-trung": "Hai Bà Trưng",
  "tay-ho": "Tây Hồ",
  "long-bien": "Long Biên",
  "cau-giay": "Cầu Giấy",
  "thanh-xuan": "Thanh Xuân",
  "hoang-mai": "Hoàng Mai",
  "ha-dong": "Hà Đông",
  "nam-tu-liem": "Nam Từ Liêm",
  "bac-tu-liem": "Bắc Từ Liêm",
  "gia-lam": "Gia Lâm",
  "dong-anh": "Đông Anh",
  "soc-son": "Sóc Sơn",
  "thanh-tri": "Thanh Trì",
  "me-linh": "Mê Linh",
  "son-tra": "Sơn Trà",
  "hai-chau": "Hải Châu",
  "ngu-hanh-son": "Ngũ Hành Sơn",
  "lien-chieu": "Liên Chiểu",
  "thanh-khe": "Thanh Khê",
  "cam-le": "Cẩm Lệ",
  "hoa-vang": "Hòa Vang",
  "thu-dau-mot": "Thủ Dầu Một",
  "di-an": "Dĩ An",
  "thuan-an": "Thuận An",
  "ben-cat": "Bến Cát",
  "tan-uyen": "Tân Uyên",
  "bau-bang": "Bàu Bàng",
  "bac-tan-uyen": "Bắc Tân Uyên",
  "dau-tieng": "Dầu Tiếng",
  "phu-giao": "Phú Giáo",
  "bien-hoa": "Biên Hòa",
  "long-thanh": "Long Thành",
  "nhon-trach": "Nhơn Trạch",
  "trang-bom": "Trảng Bom",
  "long-khanh": "Long Khánh",
  "duc-hoa": "Đức Hòa",
  "can-duoc": "Cần Đước",
  "can-giuoc": "Cần Giuộc",
  "ben-luc": "Bến Lức",
  "tan-an": "Tân An",
  "hai-phong": "Hải Phòng",
  "can-tho": "Cần Thơ",
  "khanh-hoa": "Khánh Hòa",
  "nha-trang": "Nha Trang",
  "lam-dong": "Lâm Đồng",
  "da-lat": "Đà Lạt",
  "ba-ria": "Bà Rịa",
  "vung-tau": "Vũng Tàu",
  "long-an": "Long An",
  "tien-giang": "Tiền Giang",
};

export function slugifyVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function districtSlugToName(slug: string): string {
  const normalized = decodeURIComponent(slug).toLowerCase();
  return (
    DISTRICT_SLUG_MAP[normalized] ??
    normalized
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}
