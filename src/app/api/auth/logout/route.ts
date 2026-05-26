import { NextResponse } from "next/server";
import { deleteSession, getAuthUser } from "@/server/auth";
import { authConfig } from "@/server/config/auth.config";
import { apiError } from "@/server/api-error";
import { cookies } from "next/headers";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return apiError("Not authenticated", 401);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.cookieName)?.value;

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.redirect(new URL("/", authConfig.baseUrl));
  response.cookies.set(authConfig.cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
