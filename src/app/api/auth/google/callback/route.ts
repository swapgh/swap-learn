import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSession, findOrCreateOAuthUser } from "@/server/auth";
import { authConfig } from "@/server/config/auth.config";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/server/oauth";

function clearOAuthCookies(response: NextResponse) {
  for (const name of [
    authConfig.oauthStateCookieName,
    authConfig.oauthVerifierCookieName,
    authConfig.oauthLocaleCookieName,
    authConfig.oauthNextCookieName,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

function redirectWithError(locale: string, error: string) {
  return NextResponse.redirect(new URL(`/${locale}/login?oauth=${error}`, authConfig.baseUrl));
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(authConfig.oauthLocaleCookieName)?.value ?? "es";
  const next = cookieStore.get(authConfig.oauthNextCookieName)?.value ?? `/${locale}/account`;
  const expectedState = cookieStore.get(authConfig.oauthStateCookieName)?.value;
  const verifier = cookieStore.get(authConfig.oauthVerifierCookieName)?.value;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    const response = redirectWithError(locale, "invalid_state");
    clearOAuthCookies(response);
    return response;
  }

  try {
    const token = await exchangeGoogleCode(code, verifier);
    const profile = await getGoogleUserInfo(token.access_token);

    if (!profile.email || !profile.email_verified) {
      const response = redirectWithError(locale, "email_not_verified");
      clearOAuthCookies(response);
      return response;
    }

    const user = await findOrCreateOAuthUser({
      provider: "google",
      providerId: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email,
    });
    const sessionToken = await createSession(user.id);
    const response = NextResponse.redirect(new URL(next, authConfig.baseUrl));

    response.cookies.set(authConfig.cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: authConfig.sessionTtlMs / 1000,
    });
    clearOAuthCookies(response);

    return response;
  } catch {
    const response = redirectWithError(locale, "failed");
    clearOAuthCookies(response);
    return response;
  }
}
