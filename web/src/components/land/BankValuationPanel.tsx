import { formatShortPrice, formatDateShort } from "@/lib/formatters";
import type { BankValuationSummary } from "@/types";

interface BankValuationPanelProps {
  summary: BankValuationSummary;
}

export function BankValuationPanel({ summary }: BankValuationPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-border p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <h3 className="font-semibold text-gray-900">Định giá ngân hàng</h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-blue-50 rounded-xl">
        <div>
          <p className="text-xs text-blue-600 mb-0.5">Định giá trung bình</p>
          <p className="font-bold text-blue-800">
            {formatShortPrice(summary.avgValuation)}
          </p>
        </div>
        <div>
          <p className="text-xs text-blue-600 mb-0.5">Vay tối đa</p>
          <p className="font-bold text-blue-800">
            {formatShortPrice(summary.maxLoan)}
          </p>
        </div>
      </div>

      {/* Bank table */}
      <div className="space-y-3">
        {summary.banks.map((bank) => (
          <div
            key={bank.id}
            className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-surface-secondary transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {bank.bankName}
              </p>
              <p className="text-xs text-gray-500">
                LTV {bank.ltvRatio}% · {formatDateShort(bank.valuationDate)}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold text-gray-900">
                {formatShortPrice(bank.valuationPrice)}
              </p>
              <span
                className={`text-xs font-semibold ${
                  bank.vsMarketPercent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {bank.vsMarketPercent >= 0 ? "+" : ""}
                {bank.vsMarketPercent.toFixed(1)}% vs thị trường
              </span>
            </div>
          </div>
        ))}
      </div>

      {summary.banks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Chưa có dữ liệu định giá
        </p>
      )}
    </div>
  );
}
