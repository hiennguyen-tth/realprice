/**
 * Format a VND amount into human-readable Vietnamese currency string.
 * E.g. 1_200_000_000 → "1.2 tỷ"
 *      500_000_000 → "500 triệu"
 *      50_000 → "50,000 đ"
 */
export function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    // Show one decimal if not a whole number
    const formatted =
      billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
    return `${formatted} tỷ`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted =
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(0);
    return `${formatted} triệu`;
  }
  return amount.toLocaleString('vi-VN') + ' đ';
}

/**
 * Short price for map bubbles and badges (even more compact).
 * E.g. 1_500_000_000 → "1.5T"
 *      800_000_000 → "800M"
 */
export function formatShortPrice(amount: number): string {
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}T`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)}M`;
  }
  return `${(amount / 1000).toFixed(0)}K`;
}

/**
 * Format price per m² in compact form.
 * E.g. 25_000_000 → "25tr/m²"
 *      150_000_000 → "150tr/m²"
 */
export function formatPricePerM2(pricePerM2: number): string {
  if (pricePerM2 >= 1_000_000_000) {
    return `${(pricePerM2 / 1_000_000_000).toFixed(1)} tỷ/m²`;
  }
  if (pricePerM2 >= 1_000_000) {
    const millions = pricePerM2 / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}tr/m²`;
  }
  return `${pricePerM2.toLocaleString('vi-VN')}đ/m²`;
}

/**
 * Format a percent change, e.g. 5.2 → "+5.2%", -3.1 → "-3.1%"
 */
export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Format area in m²
 */
export function formatArea(area: number): string {
  return `${area.toLocaleString('vi-VN')} m²`;
}

/**
 * Format a loan amount with schedule context
 */
export function formatMonthlyPayment(amount: number): string {
  return formatVND(amount) + '/tháng';
}
