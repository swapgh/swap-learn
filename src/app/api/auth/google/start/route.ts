import { NextRequest, NextResponse } from "next/server";
import { isLocale } from "@/lib/locale";
import { authConfig } from "@/server/config/auth.config";
import {
  googleAuthorizationUrl,
  isGoogleOAuthConfigured,
  randomOAuthValue,
} from "@/server/oauth";

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: authConfig.oauthCookieMaxAge,
  };
}

export function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "es";
  const locale = isLocale(localeParam) ? localeParam : "es";
  const next = request.nextUrl.searchParams.get("next") ?? `/${locale}/account`;

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL(`/${locale}/login?oauth=not_configured`, authConfig.baseUrl));
  }

  const state = randomOAuthValue();
  const verifier = randomOAuthValue();
  const response = NextResponse.redirect(
    googleAuthorizationUrl({ state, verifier }),
  );
  const options = authCookieOptions();

  response.cookies.set(authConfig.oauthStateCookieName, state, options);
  response.cookies.set(authConfig.oauthVerifierCookieName, verifier, options);
  response.cookies.set(authConfig.oauthLocaleCookieName, locale, options);
  response.cookies.set(authConfig.oauthNextCookieName, next, options);

  return response;
}
