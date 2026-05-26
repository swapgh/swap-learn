import { NextRequest, NextResponse } from "next/server";
import { getApiAuthUser } from "@/server/auth";
import { apiError } from "@/server/api-error";

export async function GET(request: NextRequest) {
  const user = await getApiAuthUser(request);

  if (!user) {
    return apiError("Not authenticated", 401);
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  });
}
