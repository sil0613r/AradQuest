#!/usr/bin/env bash
# Open the AradQuest app in Google Chrome.
# The stack must be running first: scripts/local.sh up

APP_URL="${APP_URL:-http://localhost:8080}"
CHROME_APP="${CHROME_APP:-Google Chrome}"

if ! curl -fsS -o /dev/null "$APP_URL/api/health/db" 2>/dev/null; then
  echo "The app is not running at $APP_URL. Start it first with: scripts/local.sh up" >&2
  exit 1
fi

if ! open -Ra "$CHROME_APP" 2>/dev/null; then
  echo "Google Chrome was not found. Install it, or set CHROME_APP to the app name." >&2
  exit 1
fi

open -a "$CHROME_APP" "$APP_URL" || exit 1
echo "Opened $APP_URL in $CHROME_APP"
