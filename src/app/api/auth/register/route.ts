import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, getAuthUser } from "@/server/auth";
import { authConfig } from "@/server/config/auth.config";
import { apiError } from "@/server/api-error";

export async function POST(request: NextRequest) {
  try {
    const existing = await getAuthUser();
    if (existing) {
      return apiError("Already logged in", 400);
    }

    const body = await request.json();
    const { username, email, password } = body;

    if (
      !username ||
      username.length < authConfig.usernameMinLength ||
      username.length > authConfig.usernameMaxLength
    ) {
      return apiError(
        `Username must be ${authConfig.usernameMinLength}-${authConfig.usernameMaxLength} characters`
      );
    }

    if (!email || !email.includes("@")) {
      return apiError("Invalid email address");
    }

    if (!password || password.length < authConfig.passwordMinLength) {
      return apiError(
        `Password must be at least ${authConfig.passwordMinLength} characters`
      );
    }

    const user = await createUser(username, email, password);
    const token = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        api_token: token,
      },
      { status: 201 }
    );

    response.cookies.set(authConfig.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authConfig.sessionTtlMs / 1000,
    });

    return response;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "USERNAME_TAKEN") return apiError("Username already taken");
      if (e.message === "EMAIL_TAKEN") return apiError("Email already taken");
    }
    return apiError("Registration failed", 500);
  }
}
