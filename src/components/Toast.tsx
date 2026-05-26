"use client";

import { useEffect, useReducer } from "react";

const style = {
  position: "fixed" as const,
  bottom: "24px",
  right: "24px",
  zIndex: 9999,
  background: "rgb(16 185 129 / 0.14)",
  border: "1px solid rgb(16 185 129 / 0.3)",
  borderRadius: "10px",
  padding: "0.85rem 1.2rem",
  color: "#6ee7b7",
  fontWeight: 700,
  fontSize: "0.9rem",
  boxShadow: "0 12px 32px rgb(0 0 0 / 0.4)",
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  animation: "toastIn 0.3s ease-out",
  maxWidth: "420px",
} as React.CSSProperties;

type Action = { type: "show" } | { type: "dismiss" };
function reducer(_state: boolean, action: Action) {
  switch (action.type) {
    case "show": return false;
    case "dismiss": return true;
  }
}

export function Toast({ message }: { message: string | null }) {
  const [dismissed, dispatch] = useReducer(reducer, !message);

  useEffect(() => {
    if (!message) return;
    dispatch({ type: "show" });
    const timer = setTimeout(() => dispatch({ type: "dismiss" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  if (dismissed || !message) return null;

  return (
    <div style={style} role="status" aria-live="polite">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  );
}
