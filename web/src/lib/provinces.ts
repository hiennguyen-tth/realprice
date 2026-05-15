const PROVINCE_BY_DISTRICT: Array<[string, string]> = [
  ["hoàn kiếm", "Hà Nội"],
  ["ba đình", "Hà Nội"],
  ["đống đa", "Hà Nội"],
  ["hai bà trưng", "Hà Nội"],
  ["tây hồ", "Hà Nội"],
  ["long biên", "Hà Nội"],
  ["cầu giấy", "Hà Nội"],
  ["thanh xuân", "Hà Nội"],
  ["hoàng mai", "Hà Nội"],
  ["hà đông", "Hà Nội"],
  ["nam từ liêm", "Hà Nội"],
  ["bắc từ liêm", "Hà Nội"],
  ["hải châu", "Đà Nẵng"],
  ["thanh khê", "Đà Nẵng"],
  ["sơn trà", "Đà Nẵng"],
  ["ngũ hành sơn", "Đà Nẵng"],
  ["liên chiểu", "Đà Nẵng"],
  ["cẩm lệ", "Đà Nẵng"],
  ["ninh kiều", "Cần Thơ"],
  ["bình thủy", "Cần Thơ"],
  ["cái răng", "Cần Thơ"],
  ["thủ dầu một", "Bình Dương"],
  ["dĩ an", "Bình Dương"],
  ["thuận an", "Bình Dương"],
  ["bến cát", "Bình Dương"],
  ["tân uyên", "Bình Dương"],
  ["biên hòa", "Đồng Nai"],
  ["long khánh", "Đồng Nai"],
  ["long thành", "Đồng Nai"],
  ["nhơn trạch", "Đồng Nai"],
  ["trảng bom", "Đồng Nai"],
  ["đức hòa", "Long An"],
  ["bến lức", "Long An"],
  ["cần giuộc", "Long An"],
  ["cần đước", "Long An"],
  ["tân an", "Long An"],
];

export function normalizeProvinceLabel(district: string, province?: string | null): string {
  const normalizedDistrict = district.toLowerCase().trim();
  const inferred = PROVINCE_BY_DISTRICT.find(([name]) => normalizedDistrict.includes(name))?.[1];
  return inferred ?? province ?? "TP.HCM";
}
