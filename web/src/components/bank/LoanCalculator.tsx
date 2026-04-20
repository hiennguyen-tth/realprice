"use client";

import { useState, useMemo } from "react";
import { formatShortPrice, formatVND } from "@/lib/formatters";

interface LoanCalculatorProps {
  maxLoan: number;
  bankName: string;
  interestRate: number;
}

export function LoanCalculator({
  maxLoan,
  bankName,
  interestRate: defaultRate,
}: LoanCalculatorProps) {
  const [loanAmount, setLoanAmount] = useState(Math.round(maxLoan * 0.8));
  const [termYears, setTermYears] = useState(20);
  const [rate, setRate] = useState(defaultRate);

  const { monthlyPayment, totalPayment, totalInterest } = useMemo(() => {
    const principal = loanAmount;
    const monthlyRate = rate / 100 / 12;
    const n = termYears * 12;

    if (monthlyRate === 0 || n === 0) {
      return {
        monthlyPayment: principal / n,
        totalPayment: principal,
        totalInterest: 0,
      };
    }

    const monthly =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1);

    return {
      monthlyPayment: monthly,
      totalPayment: monthly * n,
      totalInterest: monthly * n - principal,
    };
  }, [loanAmount, termYears, rate]);

  const loanPercent = Math.round((loanAmount / maxLoan) * 100);

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-4 text-sm">
        Tính khoản vay — {bankName}
      </h4>

      <div className="space-y-4">
        {/* Loan amount slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-600">
              Số tiền vay
            </label>
            <span className="text-sm font-bold text-blue-600">
              {formatShortPrice(loanAmount)}
            </span>
          </div>
          <input
            type="range"
            min={Math.round(maxLoan * 0.1)}
            max={maxLoan}
            step={50_000_000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatShortPrice(Math.round(maxLoan * 0.1))}</span>
            <span className="text-blue-500">{loanPercent}% LTV</span>
            <span>{formatShortPrice(maxLoan)}</span>
          </div>
        </div>

        {/* Term slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-600">
              Thời hạn vay
            </label>
            <span className="text-sm font-bold text-gray-900">
              {termYears} năm
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={termYears}
            onChange={(e) => setTermYears(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5 năm</span>
            <span>30 năm</span>
          </div>
        </div>

        {/* Interest rate */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-600">
              Lãi suất/năm
            </label>
            <span className="text-sm font-bold text-gray-900">
              {rate.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={15}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 rounded-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5%</span>
            <span>15%</span>
          </div>
        </div>
      </div>

      {/* Result card */}
      <div className="mt-5 bg-blue-600 text-white rounded-xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-blue-200 mb-1">Trả hàng tháng</p>
            <p className="text-base font-bold">
              {formatShortPrice(monthlyPayment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-200 mb-1">Tổng tiền lãi</p>
            <p className="text-base font-bold">
              {formatShortPrice(totalInterest)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-200 mb-1">Tổng phải trả</p>
            <p className="text-base font-bold">
              {formatShortPrice(totalPayment)}
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-200 text-center mt-2">
          * Ước tính sơ bộ, lãi suất thực tế theo ngân hàng
        </p>
      </div>
    </div>
  );
}
