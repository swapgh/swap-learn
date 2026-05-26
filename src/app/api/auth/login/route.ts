import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  createSession,
  getAuthUser,
} from "@/server/auth";
import { authConfig } from "@/server/config/auth.config";
import { apiError } from "@/server/api-error";

export async function POST(request: NextRequest) {
  try {
    const existing = await getAuthUser();
    if (existing) {
      return apiError("Already logged in", 400);
    }

    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return apiError("Identifier and password are required");
    }

    const user = await authenticateUser(identifier, password);
    if (!user) {
      return apiError("Invalid credentials", 401);
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      api_token: token,
    });

    response.cookies.set(authConfig.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authConfig.sessionTtlMs / 1000,
    });

    return response;
  } catch {
    return apiError("Login failed", 500);
  }
}
