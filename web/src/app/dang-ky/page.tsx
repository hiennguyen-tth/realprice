"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clsx } from "clsx";
import { registerApi } from "@/lib/api";

const registerSchema = z.object({
    name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [authError, setAuthError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setAuthError("");
        try {
            const { user, token } = await registerApi(
                data.name,
                data.email,
                data.password
            );

            if (!user || !token) {
                setAuthError("Có lỗi xảy ra khi đăng ký");
                return;
            }

            // Auto login after successful registration
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setAuthError("Đăng ký thành công nhưng không thể đăng nhập tự động");
            } else {
                router.push("/tai-khoan");
            }
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message;
            setAuthError(message || "Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface-secondary px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white rounded-2xl shadow-panel border border-border p-8">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">RP</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                            Real<span className="text-primary">Price</span>
                        </span>
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
                        Đăng ký tài khoản
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Tạo tài khoản mới để bắt đầu
                    </p>

                    {authError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Họ và tên
                            </label>
                            <input
                                {...register("name")}
                                type="text"
                                placeholder="Nguyễn Văn A"
                                className={clsx(
                                    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                                    errors.name ? "border-red-400" : "border-border focus:border-primary"
                                )}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="you@example.com"
                                className={clsx(
                                    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                                    errors.email ? "border-red-400" : "border-border focus:border-primary"
                                )}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mật khẩu
                            </label>
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                                className={clsx(
                                    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                                    errors.password ? "border-red-400" : "border-border focus:border-primary"
                                )}
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Xác nhận mật khẩu
                            </label>
                            <input
                                {...register("confirmPassword")}
                                type="password"
                                placeholder="••••••••"
                                className={clsx(
                                    "w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                                    errors.confirmPassword ? "border-red-400" : "border-border focus:border-primary"
                                )}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Đang đăng ký...
                                </>
                            ) : (
                                "Đăng ký"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Đã có tài khoản?{" "}
                        <Link href="/dang-nhap" className="text-primary font-medium hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Bằng việc đăng ký, bạn đồng ý với{" "}
                    <Link href="/dieu-khoan" className="text-primary hover:underline">
                        Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link href="/chinh-sach-bao-mat" className="text-primary hover:underline">
                        Chính sách bảo mật
                    </Link>
                </p>
            </div>
        </div>
    );
}