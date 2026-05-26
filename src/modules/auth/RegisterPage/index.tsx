"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { localizePath } from "@/lib/routes";
import { registerContent } from "./content";
import styles from "./styles.module.css";

async function registerAction(_prev: unknown, formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.error ?? "Registration failed" };
  }

  return { success: true };
}

export function RegisterPage({ locale }: { locale: Locale }) {
  const content = registerContent[locale];
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(registerAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push(localizePath(locale, "/account"));
    }
  }, [locale, router, state?.success]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.heading}>{content.heading}</h1>
        <p className={styles.lead}>{content.lead}</p>

        <a
          className={styles.oauthButton}
          href={`/api/auth/google/start?locale=${locale}&next=${encodeURIComponent(localizePath(locale, "/account"))}`}
        >
          <span aria-hidden="true">G</span>
          {content.oauthLabel}
        </a>

        <div className={styles.divider}>
          <span>{content.oauthDivider}</span>
        </div>

        <form action={dispatch} className={styles.form}>
          {content.fields.map((field) => (
            <label key={field.name} className={styles.field}>
              <span>{field.label}</span>
              <input
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                minLength={field.minLength}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
              />
            </label>
          ))}

          {state?.error && (
            <p className={styles.error}>{state.error}</p>
          )}

          <button
            type="submit"
            className={styles.submit}
            disabled={isPending}
          >
            {isPending ? "..." : content.submitLabel}
          </button>
        </form>

        <Link
          href={localizePath(locale, content.altHref)}
          className={styles.alt}
        >
          {content.altLabel}
        </Link>
      </div>
    </div>
  );
}
