// ─────────────────────────────────────────────────────────────────────────────
// Vietnamese price formatters
// All prices are stored as integer VND
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format full VND price: 2,500,000,000 → "2.500.000.000 ₫"
 */
export function formatVND(value: number): string {
  if (!isFinite(value)) return "—";
  return (
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value)
  );
}

/**
 * Format short price for display:
 * 2,500,000,000 → "2,5 tỷ"
 * 500,000,000  → "500 triệu"
 * 50,000,000   → "50 triệu"
 */
export function formatShortPrice(value: number): string {
  if (!isFinite(value) || value <= 0) return "—";

  if (value >= 1_000_000_000) {
    const ty = value / 1_000_000_000;
    const formatted =
      ty % 1 === 0
        ? ty.toFixed(0)
        : ty.toFixed(1).replace(".", ",");
    return `${formatted} tỷ`;
  }

  if (value >= 1_000_000) {
    const tr = value / 1_000_000;
    const formatted =
      tr % 1 === 0
        ? tr.toFixed(0)
        : tr.toFixed(1).replace(".", ",");
    return `${formatted} triệu`;
  }

  return formatVND(value);
}

/**
 * Format price per m²: 45,000,000 → "45 triệu/m²"
 */
export function formatPricePerM2(value: number): string {
  if (!isFinite(value) || value <= 0) return "—";
  return `${formatShortPrice(value)}/m²`;
}

/**
 * Format area in m²: 85.5 → "85,5 m²"
 */
export function formatArea(value: number | string): string {
  const numeric = Number(value);
  if (!isFinite(numeric) || numeric <= 0) return "—";
  const formatted = numeric % 1 === 0
    ? numeric.toFixed(0)
    : numeric.toFixed(1).replace(".", ",");
  return `${formatted} m²`;
}

/**
 * Format date string → Vietnamese locale: "2024-01-15" → "15 tháng 1, 2024"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Format date short: "2024-01-15" → "15/01/2024"
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Format month for chart axis: "2024-01" → "T1/24"
 */
export function formatMonthShort(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(2);
  return `T${month}/${year}`;
}

/**
 * Format percentage with sign: 5.2 → "+5,2%", -3 → "-3%"
 */
export function formatPercent(value: number, digits = 1): string {
  if (!isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  const formatted = value.toFixed(digits).replace(".", ",");
  return `${sign}${formatted}%`;
}

/**
 * Format listing type to Vietnamese label
 */
export function formatListingType(type: string): string {
  const map: Record<string, string> = {
    dat_nen: "Đất nền",
    nha_pho: "Nhà phố",
    chung_cu: "Chung cư",
    biet_thu: "Biệt thự",
    van_phong: "Văn phòng",
  };
  return map[type] ?? type;
}

/**
 * Format listing status to Vietnamese label
 */
export function formatListingStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Đang bán",
    sold: "Đã bán",
    expired: "Hết hạn",
    pending: "Chờ duyệt",
  };
  return map[status] ?? status;
}

/**
 * Clamp + compute price level (1–5) based on district average
 */
export function computePriceLevel(
  pricePerM2: number,
  districtAvg: number
): 1 | 2 | 3 | 4 | 5 {
  const ratio = pricePerM2 / districtAvg;
  if (ratio < 0.7) return 1;
  if (ratio < 0.9) return 2;
  if (ratio < 1.1) return 3;
  if (ratio < 1.3) return 4;
  return 5;
}
