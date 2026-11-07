#!/usr/bin/env bash
# AradQuest local helper. Run it from anywhere:
#
#   scripts/local.sh up     start the stack (rebuilds the images), apply the database scripts,
#                           and print the addresses to open for manual testing
#   scripts/local.sh test   everything, from start to finish: stack, database, API, hints,
#                           chatbot, browser flows, frontend lint and build
#   scripts/local.sh down   stop the stack (the database data is kept)
#   scripts/local.sh logs   follow the api and bot logs
#
# Optional environment variables:
#   CHROME_PATH  Google Chrome for the browser checks (default: the macOS install location)
#   DB_NAME      database name (default: arad_quest)
#   DB_USER      database user (default: aradquest)
#
# Note: the chatbot checks and the browser flows call the real OpenAI model, so they cost a little.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker/docker-compose.yml" --env-file "$ROOT/docker/.env")
CHROME_PATH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
DB_NAME="${DB_NAME:-arad_quest}"
DB_USER="${DB_USER:-aradquest}"
export CHROME_PATH

RESULTS=()
FAILED=0

say() { printf '\n=== %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

check_prerequisites() {
  for tool in docker python3 node npm curl; do
    command -v "$tool" >/dev/null 2>&1 || die "'$tool' is not installed."
  done
  docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and try again."

  for file in docker/.env api/secrets.env ai_bot/backend/.env; do
    [ -f "$ROOT/$file" ] || die "missing $file. Copy it from its .example file and fill it in."
  done

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
  "${COMPOSE[@]}" up -d --build --wait db api bot web || die "docker compose failed. See: scripts/local.sh logs"
}

apply_database() {
  say "Database scripts (safe to run again)"
  local db_container script
  db_container="$("${COMPOSE[@]}" ps -q db)"
  [ -n "$db_container" ] || die "the database container is not running."
  for script in 01_create_tables.sql 02_insert_data.sql 05_user_settings.sql; do
    if docker exec -i "$db_container" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q < "$ROOT/database/$script"; then
      echo "OK    $script"
    else
      die "$script failed."
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
  wait_for_url http://localhost:8080/api/health/db "web -> api -> database" || die "the stack did not come up. See: scripts/local.sh logs"
  wait_for_url http://localhost:8000/health "chatbot" || die "the chatbot did not come up. See: scripts/local.sh logs"
}

print_addresses() {
  cat <<EOF

The app is running. Open it and test by hand:

  App (start here):  http://localhost:8080
                     Register or log in, then My Adventures -> Historical Discoverer
  Game API:          http://localhost:8001/health
  Chatbot:           http://localhost:8000/health
  Database:          localhost:5433   (user $DB_USER, database $DB_NAME)

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
    check_prerequisites
    start_stack
    apply_database
    check_urls
    print_addresses
    ;;
  test)
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
    echo "usage: scripts/local.sh up | test | down | logs"
    exit 1
    ;;
esac
