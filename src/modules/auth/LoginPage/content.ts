import type { Locale } from "@/lib/locale";
import type { AuthPageContent } from "@/lib/types";

export const loginContent: Record<Locale, AuthPageContent> = {
  es: {
    title: "Iniciar sesión - Swap RPG",
    description: "Accede a tu cuenta de Swap RPG",
    heading: "Iniciar sesión",
    lead: "Accede a tu cuenta para gestionar tu personaje y contribuciones.",
    fields: [
      {
        name: "identifier",
        type: "text",
        label: "Usuario o correo",
        placeholder: "usuario o correo@ejemplo.com",
        required: true,
        autoComplete: "username",
      },
      {
        name: "password",
        type: "password",
        label: "Contraseña",
        placeholder: "••••••••",
        required: true,
        autoComplete: "current-password",
      },
    ],
    submitLabel: "Entrar",
    altLabel: "¿No tienes cuenta? Regístrate",
    altHref: "/register",
    oauthLabel: "Continuar con Google",
    oauthDivider: "o",
    oauthErrors: {
      not_configured: "Google login no está configurado en este entorno.",
      invalid_state: "La sesión de Google caducó. Inténtalo otra vez.",
      email_not_verified: "Google no confirmó este correo.",
      failed: "No se pudo completar el acceso con Google.",
    },
    errors: {
      "invalid": "Credenciales incorrectas",
      "required": "Completa todos los campos",
    },
  },
  en: {
    title: "Login - Swap RPG",
    description: "Access your Swap RPG account",
    heading: "Log in",
    lead: "Access your account to manage your character and contributions.",
    fields: [
      {
        name: "identifier",
        type: "text",
        label: "Username or email",
        placeholder: "username or email@example.com",
        required: true,
        autoComplete: "username",
      },
      {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "••••••••",
        required: true,
        autoComplete: "current-password",
      },
    ],
    submitLabel: "Sign in",
    altLabel: "Don't have an account? Register",
    altHref: "/register",
    oauthLabel: "Continue with Google",
    oauthDivider: "or",
    oauthErrors: {
      not_configured: "Google login is not configured in this environment.",
      invalid_state: "The Google session expired. Try again.",
      email_not_verified: "Google did not verify this email.",
      failed: "Google login could not be completed.",
    },
    errors: {
      "invalid": "Invalid credentials",
      "required": "Fill in all fields",
    },
  },
};
