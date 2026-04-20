"use client";

import { useState } from "react";
import { formatShortPrice, formatDateShort } from "@/lib/formatters";
import { LoanCalculator } from "./LoanCalculator";
import type { BankValuationSummary } from "@/types";

interface BankValuationPanelProps {
  summary: BankValuationSummary;
}

export function BankValuationPanel({ summary }: BankValuationPanelProps) {
  const [showCalc, setShowCalc] = useState(false);
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const selectedBank = summary.banks[selectedBankIdx];

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900">Định giá ngân hàng</h2>
          </div>
          <button
            onClick={() => setShowCalc(!showCalc)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {showCalc ? "Ẩn tính toán" : "Tính khoản vay"}
          </button>
        </div>

        {/* Summary */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">TB định giá</p>
            <p className="text-sm font-bold text-gray-900">
              {formatShortPrice(summary.avgValuation)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">Vay tối đa</p>
            <p className="text-sm font-bold text-blue-600">
              {formatShortPrice(summary.maxLoan)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-0.5">LTV tốt nhất</p>
            <p className="text-sm font-bold text-green-600">
              {summary.highestLTV}%
            </p>
          </div>
        </div>
      </div>

      {/* Bank table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Ngân hàng</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Định giá</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">LTV</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Vay tối đa</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">vs TT</th>
            </tr>
          </thead>
          <tbody>
            {summary.banks.map((bank, idx) => (
              <tr
                key={bank.id}
                onClick={() => setSelectedBankIdx(idx)}
                className={`border-b border-border cursor-pointer hover:bg-blue-50/50 transition-colors ${
                  selectedBankIdx === idx ? "bg-blue-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{bank.bankName}</div>
                  <div className="text-xs text-gray-400">{formatDateShort(bank.valuationDate)}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatShortPrice(bank.valuationPrice)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {bank.ltvRatio}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                  {formatShortPrice(bank.maxLoan)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-bold ${
                    bank.vsMarketPercent >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {bank.vsMarketPercent >= 0 ? "+" : ""}{bank.vsMarketPercent.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loan calculator */}
      {showCalc && selectedBank && (
        <div className="border-t border-border p-5">
          <LoanCalculator
            maxLoan={selectedBank.maxLoan}
            bankName={selectedBank.bankName}
            interestRate={selectedBank.interestRate ?? 9.5}
          />
        </div>
      )}
    </div>
  );
}
