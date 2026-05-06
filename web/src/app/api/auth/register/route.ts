import { NextRequest, NextResponse } from "next/server";
import { registerApi } from "@/lib/api";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Tên, email và mật khẩu là bắt buộc" },
                { status: 400 }
            );
        }

        const { user, token } = await registerApi(name, email, password);

        return NextResponse.json({
            message: "Đăng ký thành công",
            user,
            token,
        });
    } catch (error: any) {
        console.error("Registration error:", error);

        // Handle specific error cases
        if (error.response?.status === 409) {
            return NextResponse.json(
                { message: "Email đã được sử dụng" },
                { status: 409 }
            );
        }

        if (error.response?.status === 400) {
            return NextResponse.json(
                { message: error.response.data?.message || "Dữ liệu không hợp lệ" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "Có lỗi xảy ra khi đăng ký" },
            { status: 500 }
        );
    }
}