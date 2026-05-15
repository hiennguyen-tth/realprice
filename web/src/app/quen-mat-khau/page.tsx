"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface-secondary px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-panel border border-border p-8">
        <Link href="/dang-nhap" className="text-sm text-primary hover:underline">
          ← Quay lại đăng nhập
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-6">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500 mt-2">
          Nhập email hoặc số điện thoại đã đăng ký. RealPrice sẽ gửi hướng dẫn đặt lại mật khẩu khi tài khoản tồn tại.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-semibold text-green-700">Đã gửi yêu cầu đặt lại mật khẩu</p>
            <p className="text-xs text-green-700/80 mt-1">
              Vui lòng kiểm tra email/SMS và làm theo hướng dẫn. Mã đặt lại sẽ hết hạn sau 15 phút.
            </p>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email hoặc số điện thoại
              </label>
              <input
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="you@example.com hoặc 0901234567"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Gửi hướng dẫn đặt lại
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 mt-5">
          Nếu bạn không còn truy cập được email/số điện thoại cũ, hãy liên hệ hỗ trợ để xác minh tài khoản.
        </p>
      </div>
    </div>
  );
}
