import "server-only";

import { createHash, randomBytes } from "crypto";
import { authConfig } from "@/server/config/auth.config";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
};

export function isGoogleOAuthConfigured() {
  return Boolean(authConfig.google.clientId && authConfig.google.clientSecret);
}

export function randomOAuthValue() {
  return randomBytes(32).toString("base64url");
}

export function codeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function googleRedirectUri() {
  return new URL("/api/auth/google/callback", authConfig.baseUrl).toString();
}

export function googleAuthorizationUrl({
  state,
  verifier,
}: {
  state: string;
  verifier: string;
}) {
  const url = new URL(authConfig.google.authorizationEndpoint);

  url.searchParams.set("client_id", authConfig.google.clientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const response = await fetch(authConfig.google.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: authConfig.google.clientId,
      client_secret: authConfig.google.clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: googleRedirectUri(),
    }),
  });

  if (!response.ok) {
    throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
  }

  return (await response.json()) as { access_token: string };
}

export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(authConfig.google.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("GOOGLE_USERINFO_FAILED");
  }

  return (await response.json()) as GoogleUserInfo;
}
