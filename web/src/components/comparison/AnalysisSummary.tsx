import { formatShortPrice, formatPricePerM2, formatArea } from "@/lib/formatters";
import type { ComparisonItem, ComparisonAnalysis } from "@/types";

interface AnalysisSummaryProps {
  items: ComparisonItem[];
  analysis: ComparisonAnalysis;
}

export function AnalysisSummary({ items, analysis }: AnalysisSummaryProps) {
  const cheapest = items[analysis.cheapestIndex]?.listing;
  const bestValue = items[analysis.bestValueIndex]?.listing;
  const largest = items[analysis.largestAreaIndex]?.listing;

  const cards = [
    {
      icon: "💰",
      title: "Giá rẻ nhất",
      listing: cheapest,
      highlight: cheapest ? formatShortPrice(cheapest.price) : "—",
      sub: cheapest ? cheapest.address : "",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
    },
    {
      icon: "🏆",
      title: "Giá/m² tốt nhất",
      listing: bestValue,
      highlight: bestValue ? formatPricePerM2(bestValue.pricePerM2) : "—",
      sub: bestValue ? bestValue.address : "",
      color: "bg-primary/5 border-primary/20",
      textColor: "text-primary",
    },
    {
      icon: "📐",
      title: "Diện tích lớn nhất",
      listing: largest,
      highlight: largest ? formatArea(largest.area) : "—",
      sub: largest ? largest.address : "",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Highlight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-2xl border p-4 ${card.color}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{card.icon}</span>
              <span className="text-xs font-semibold text-gray-600">{card.title}</span>
            </div>
            <p className={`text-xl font-bold ${card.textColor}`}>
              {card.highlight}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="bg-gray-900 text-white rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-base">
            💡
          </div>
          <div>
            <p className="font-semibold mb-1 text-sm">Nhận xét</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {analysis.recommendation}
            </p>
            <p className="text-xs text-gray-400 mt-2">{analysis.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
