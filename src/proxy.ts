import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/(es|en)(\/|$)/);
  const locale = match?.[1] ?? "es";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: "/((?!api|images|manifest\\.webmanifest|_next|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
};
