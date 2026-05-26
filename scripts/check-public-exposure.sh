#!/usr/bin/env bash
set -u

if [ -z "${DEPLOY_URL:-}" ]; then
  echo "Set DEPLOY_URL first, for example:"
  echo "DEPLOY_URL=https://example.com npm run security:check-public"
  exit 2
fi

base="${DEPLOY_URL%/}"

case "$base" in
  "https://your-domain.com"|"http://your-domain.com"|"https://example.com"|"http://example.com")
    echo "DEPLOY_URL is still an example domain. Use the real production domain."
    exit 2
    ;;
esac

paths=(
  "/package.json"
  "/package-lock.json"
  "/server.js"
  "/next.config.ts"
  "/middleware.ts"
  "/tsconfig.json"
  "/.git/config"
  "/.git/HEAD"
  "/.env"
  "/.env.local"
  "/src/app/page.tsx"
  "/src/app/api/health/route.ts"
  "/src/server/auth.ts"
  "/src/server/storage.ts"
  "/README.md"
  "/node_modules/next/package.json"
  "/.next/server/app/page.js"
  "/tmp/restart.txt"
)

failed=0

for path in "${paths[@]}"; do
  code="$(curl -L -s -o /dev/null -w "%{http_code}" "$base$path")"

  case "$code" in
    403|404)
      printf "OK      %s -> %s\n" "$path" "$code"
      ;;
    *)
      printf "EXPOSED %s -> %s\n" "$path" "$code"
      failed=1
      ;;
  esac
done

exit "$failed"
