import "server-only";

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const sessionTtlHours = numberFromEnv(process.env.SESSION_TTL_HOURS, 8);

export const authConfig = {
  passwordMinLength: 6,
  usernameMinLength: 3,
  usernameMaxLength: 24,
  sessionTtlMs: sessionTtlHours * 60 * 60 * 1000,
  cookieName: "swap_session",
  oauthStateCookieName: "swap_oauth_state",
  oauthVerifierCookieName: "swap_oauth_verifier",
  oauthLocaleCookieName: "swap_oauth_locale",
  oauthNextCookieName: "swap_oauth_next",
  oauthCookieMaxAge: 10 * 60,
  baseUrl: process.env.AUTH_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://swap.com.es",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    userInfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  },
  rateLimit: {
    login: { attempts: 5, windowMs: 300_000 },
    register: { attempts: 5, windowMs: 600_000 },
  },
};
