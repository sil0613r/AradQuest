#!/usr/bin/env bash
# AradQuest local helper. Run it from anywhere:
#
#   scripts/local.sh up            start the stack (rebuilds the images), apply the database scripts
#                                  to the Railway database, and print the addresses to open for manual testing
#   scripts/local.sh up --no-gps   the same, with the GPS check turned off: no location prompt in the
#                                  browser, and answers are accepted from any place
#   scripts/local.sh test          everything, from start to finish: stack, database, API, hints,
#                                  chatbot, browser flows, frontend lint and build
#   scripts/local.sh test --no-gps   the same, with the GPS check turned off (skips the far-away checks)
#   scripts/local.sh down          stop the stack (the database data is kept)
#   scripts/local.sh logs          follow the api and bot logs
#
# The database is the Railway PostGIS service. Its URL is DATABASE_URL in api/secrets.env.
# No local database container is started (see docker/docker-compose.yml, profile "local-db").
#
# Optional environment variables:
#   CHROME_PATH  Google Chrome for the browser checks (default: the macOS install location)
#
# Note: the chatbot checks and the browser flows call the real OpenAI model, so they cost a little.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.yml" --env-file "$ROOT/docker/.env")
CHROME_PATH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
export CHROME_PATH

RESULTS=()
FAILED=0

say() { printf '\n=== %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

# --no-gps: test mode. The API stops checking the distance, and the frontend does not ask the browser
# for the location. Every script reads these variables, so they are set here once.
parse_flags() {
  for arg in "$@"; do
    case "$arg" in
      --no-gps)
        export GPS_CHECK_ENABLED=false VITE_NO_GPS=true NO_GPS=1
        echo "Test mode: GPS checks are OFF (--no-gps). Answers are accepted from any place."
        ;;
      *) die "unknown option: $arg (the only option is --no-gps)" ;;
    esac
  done
}

check_prerequisites() {
  for tool in docker python3 node npm curl psql; do
    command -v "$tool" >/dev/null 2>&1 || die "'$tool' is not installed."
  done
  docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and try again."

  for file in docker/.env api/secrets.env ai_bot/backend/.env; do
    [ -f "$ROOT/$file" ] || die "missing $file. Copy it from its .example file and fill it in."
  done

  # The database URL (with its password) is read here and never printed.
  local database_url
  database_url="$(sed -n 's/^DATABASE_URL=//p' "$ROOT/api/secrets.env" | head -n 1)"
  case "$database_url" in
    postgresql://*@*/*) ;;
    *) die "DATABASE_URL in api/secrets.env is empty or not a postgresql:// URL. Use the Railway DATABASE_PUBLIC_URL." ;;
  esac

  # The API and the chatbot must share one token. Compare the values without printing them.
  local api_token bot_token
  api_token="$(sed -n 's/^BOT_INTERNAL_TOKEN=//p' "$ROOT/api/secrets.env" | head -n 1)"
  bot_token="$(sed -n 's/^INTERNAL_TOKEN=//p' "$ROOT/ai_bot/backend/.env" | head -n 1)"
  [ -n "$api_token" ] || die "BOT_INTERNAL_TOKEN is empty in api/secrets.env."
  [ "$api_token" = "$bot_token" ] || die "BOT_INTERNAL_TOKEN (api/secrets.env) and INTERNAL_TOKEN (ai_bot/backend/.env) must be the same value."
}

check_chrome() {
  [ -x "$CHROME_PATH" ] || die "Google Chrome was not found at: $CHROME_PATH. Set CHROME_PATH to run the browser checks."
}

install_test_dependencies() {
  if [ ! -d "$ROOT/tests/e2e/node_modules" ]; then
    say "Installing browser test packages"
    (cd "$ROOT/tests/e2e" && npm install --no-audit --no-fund) || die "npm install failed in tests/e2e."
  fi
  if [ ! -d "$ROOT/frontend/node_modules" ]; then
    say "Installing frontend packages"
    (cd "$ROOT/frontend" && npm install --no-audit --no-fund) || die "npm install failed in frontend."
  fi
}

start_stack() {
  say "Starting the stack (images are rebuilt from the current code)"
  "${COMPOSE[@]}" up -d --build --wait api bot web || die "docker compose failed. See: scripts/local.sh logs"
}

apply_database() {
  say "Database scripts on the Railway database (safe to run again)"
  local database_url script
  database_url="$(sed -n 's/^DATABASE_URL=//p' "$ROOT/api/secrets.env" | head -n 1)"
  for script in 01_create_tables.sql 02_insert_data.sql 05_user_settings.sql; do
    if psql "$database_url" -v ON_ERROR_STOP=1 -q -f "$ROOT/database/$script" >/dev/null; then
      echo "OK    $script"
    else
      die "$script failed. Check DATABASE_URL in api/secrets.env and that the PostGIS service is running."
    fi
  done
}

wait_for_url() {
  local url="$1" label="$2" i
  for i in $(seq 1 60); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "OK    $label"
      return 0
    fi
    sleep 2
  done
  echo "FAIL  $label ($url did not answer within 2 minutes)"
  return 1
}

check_urls() {
  say "Health checks"
  wait_for_url http://localhost:8080/api/health/db "web -> api -> Railway database" || die "the stack did not come up. See: scripts/local.sh logs"
  wait_for_url http://localhost:8000/health "chatbot" || die "the chatbot did not come up. See: scripts/local.sh logs"
}

print_addresses() {
  cat <<EOF

The app is running. Open it and test by hand:

  App (start here):  http://localhost:8080
                     Register or log in, then My Adventures -> Historical Discoverer
  Game API:          http://localhost:8001/health
  Chatbot:           http://localhost:8000/health
  Database:          the Railway PostGIS service (DATABASE_URL in api/secrets.env)

  Logs:  scripts/local.sh logs
  Stop:  scripts/local.sh down
EOF
}

run_step() {
  local label="$1"
  shift
  say "$label"
  if "$@"; then
    RESULTS+=("PASS  $label")
  else
    RESULTS+=("FAIL  $label")
    FAILED=1
  fi
}

run_tests() {
  run_step "API checks (api_full.py)" python3 "$ROOT/tests/e2e/api_full.py"
  run_step "Hint checks (hints_test.py)" python3 "$ROOT/tests/e2e/hints_test.py"
  run_step "Chatbot checks (bot_full.py)" python3 "$ROOT/tests/e2e/bot_full.py"
  run_step "API contract workflow (spec_workflow.py)" python3 "$ROOT/tests/e2e/spec_workflow.py"
  run_step "Browser: hint flow (hints_ui.js)" node "$ROOT/tests/e2e/hints_ui.js"
  run_step "Browser: full app (full.js)" node "$ROOT/tests/e2e/full.js"
  run_step "Browser: workflow (workflow.js)" node "$ROOT/tests/e2e/workflow.js"
  run_step "Frontend: lint" bash -c "cd '$ROOT/frontend' && npm run lint"
  run_step "Frontend: production build" bash -c "cd '$ROOT/frontend' && npm run build"

  say "Summary"
  local line
  for line in "${RESULTS[@]}"; do
    echo "$line"
  done
  if [ "$FAILED" -eq 0 ]; then
    echo "All checks passed."
    return 0
  fi
  echo "Some checks failed. Scroll up to the failing step, or run: scripts/local.sh logs"
  return 1
}

case "${1:-}" in
  up)
    parse_flags "${@:2}"
    check_prerequisites
    start_stack
    apply_database
    check_urls
    print_addresses
    ;;
  test)
    parse_flags "${@:2}"
    check_prerequisites
    check_chrome
    start_stack
    apply_database
    check_urls
    install_test_dependencies
    run_tests
    exit $?
    ;;
  down)
    "${COMPOSE[@]}" down
    ;;
  logs)
    "${COMPOSE[@]}" logs -f api bot
    ;;
  *)
    echo "usage: scripts/local.sh up [--no-gps] | test [--no-gps] | down | logs"
    exit 1
    ;;
esac
