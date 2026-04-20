"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatMonthShort, formatShortPrice, formatPercent } from "@/lib/formatters";
import type { PriceHistory } from "@/types";

interface PriceHistoryChartProps {
  history: PriceHistory;
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-border rounded-xl shadow-panel p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-bold" style={{ color: entry.color }}>
          {formatShortPrice(entry.value)}/m²
        </p>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const chartData = history.points.map((p) => ({
    date: formatMonthShort(p.date),
    pricePerM2: p.pricePerM2,
    avgPrice: p.avgPrice,
  }));

  const change = history.changePercent30d;
  const trendUp = change > 0;

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Lịch sử giá (6 tháng)</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">30 ngày:</span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trendUp
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {trendUp ? "▲" : "▼"} {formatPercent(Math.abs(change), 1)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              `${(v / 1_000_000).toFixed(0)}M`
            }
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="pricePerM2"
            stroke="#FF5A1F"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#FF5A1F", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#FF5A1F" }}
            name="Giá/m²"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-gray-500">30 ngày</p>
          <p className={`text-sm font-bold ${trendUp ? "text-red-600" : "text-green-600"}`}>
            {formatPercent(change, 1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">90 ngày</p>
          <p className={`text-sm font-bold ${history.changePercent90d > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatPercent(history.changePercent90d, 1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">180 ngày</p>
          <p className={`text-sm font-bold ${history.changePercent180d > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatPercent(history.changePercent180d, 1)}
          </p>
        </div>
      </div>
    </div>
  );
}
