"use client";

import type { Metadata } from "next";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "general", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Liên hệ</h1>
        <p className="text-gray-500 mt-2">Chúng tôi thường phản hồi trong vòng 24 giờ làm việc.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Info */}
        <div className="lg:col-span-2 space-y-6">
          {[
            {
              icon: "📧",
              title: "Email",
              content: "support@realprice.vn",
              sub: "Hỗ trợ kỹ thuật & tài khoản",
            },
            {
              icon: "💼",
              title: "Kinh doanh & Đối tác",
              content: "business@realprice.vn",
              sub: "Hợp tác, quảng cáo, API",
              id: "doi-tac",
            },
            {
              icon: "🐛",
              title: "Báo cáo lỗi",
              content: "bugs@realprice.vn",
              sub: "Lỗi kỹ thuật, tin đăng sai",
              id: "bao-loi",
            },
            {
              icon: "📍",
              title: "Địa chỉ",
              content: "Đà Nẵng, Việt Nam",
              sub: "Không tiếp khách trực tiếp",
            },
          ].map((item) => (
            <div key={item.title} id={item.id} className="flex gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                <p className="text-primary font-medium text-sm">{item.content}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border shadow-card p-6">
          {sent ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đã gửi thành công!</h2>
              <p className="text-gray-500 text-sm">Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Họ tên *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Số điện thoại</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Chủ đề</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="general">Câu hỏi chung</option>
                  <option value="listing">Vấn đề tin đăng</option>
                  <option value="account">Tài khoản</option>
                  <option value="partner">Hợp tác / Đối tác</option>
                  <option value="bug">Báo cáo lỗi</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Nội dung *</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Mô tả chi tiết vấn đề của bạn..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {loading ? "Đang gửi..." : "Gửi liên hệ"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
