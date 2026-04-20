import { clsx } from "clsx";
import { formatShortPrice, formatPricePerM2 } from "@/lib/formatters";

interface PriceTagProps {
  price: number;
  pricePerM2?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showPerM2?: boolean;
}

export function PriceTag({
  price,
  pricePerM2,
  size = "md",
  className,
  showPerM2 = false,
}: PriceTagProps) {
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-base font-bold",
    lg: "text-xl font-bold",
  };

  return (
    <div className={clsx("flex flex-col", className)}>
      <span className={clsx("text-primary", sizeClasses[size])}>
        {formatShortPrice(price)}
      </span>
      {showPerM2 && pricePerM2 && (
        <span className="text-xs text-gray-500 font-normal">
          {formatPricePerM2(pricePerM2)}
        </span>
      )}
    </div>
  );
}
