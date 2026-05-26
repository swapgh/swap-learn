export const cookieConsentName = "swap_cookie_consent";

export type CookieConsentChoice = "accepted" | "rejected";

export type CookieConsentRecord = {
  choice: CookieConsentChoice;
  version: string;
  updatedAt: string;
  source: "banner";
};

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return "";

  return parts.pop()?.split(";").shift() ?? "";
}

function writeCookie(name: string, value: string, days = 180) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

export function getCookieConsentRecord(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem(cookieConsentName);
  if (storedValue) {
    try {
      return JSON.parse(storedValue) as CookieConsentRecord;
    } catch {
      window.localStorage.removeItem(cookieConsentName);
    }
  }

  const cookieValue = readCookie(cookieConsentName);
  if (!cookieValue) return null;

  try {
    return JSON.parse(decodeURIComponent(cookieValue)) as CookieConsentRecord;
  } catch {
    return null;
  }
}

export function shouldShowCookieBanner(
  record: CookieConsentRecord | null,
  consentVersion: string,
) {
  return !record || record.version !== consentVersion || !record.choice;
}

export function setCookieConsentRecord(
  choice: CookieConsentChoice,
  consentVersion: string,
) {
  const record: CookieConsentRecord = {
    choice,
    version: consentVersion,
    updatedAt: new Date().toISOString(),
    source: "banner",
  };

  const serialized = JSON.stringify(record);
  window.localStorage.setItem(cookieConsentName, serialized);
  writeCookie(cookieConsentName, encodeURIComponent(serialized));
  document.documentElement.dataset.cookieConsent = choice;

  window.dispatchEvent(
    new CustomEvent("swap-cookie-consent", { detail: record }),
  );

  return record;
}
