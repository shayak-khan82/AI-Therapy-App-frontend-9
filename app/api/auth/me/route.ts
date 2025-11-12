
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://ai-agents-backend-2.onrender.com";

  const token = req.headers.get("authorization");

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: token || "",
      },
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
