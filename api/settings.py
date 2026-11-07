"""Settings read from environment variables.

Non-secret values come from api/.env, passwords and the session secret from api/secrets.env.
On Railway (or any host that sets real variables) those variables win over the files.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from psycopg.conninfo import make_conninfo

_HERE = Path(__file__).parent
load_dotenv(_HERE / ".env")
load_dotenv(_HERE / "secrets.env")


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _database_conninfo() -> str:
    # A full DATABASE_URL (Railway provides one) is used as-is. Otherwise build it from the DB_* parts,
    # so the password is never written into a URL inside a config file.
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    return make_conninfo(
        host=_required("DB_HOST"),
        port=_required("DB_PORT"),
        dbname=_required("DB_NAME"),
        user=_required("DB_USER"),
        password=_required("DB_PASSWORD"),
    )


DATABASE_CONNINFO = _database_conninfo()
SESSION_SECRET = _required("SESSION_SECRET")      # long random string, signs the login cookie

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"   # true on HTTPS deployments
SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

# The chatbot service holds the mission texts and hints (ai_bot/backend/missions.json).
# Private-network address and the shared secret. Empty = hints are unavailable.
BOT_INTERNAL_URL = os.getenv("BOT_INTERNAL_URL", "").strip().rstrip("/")
BOT_INTERNAL_TOKEN = os.getenv("BOT_INTERNAL_TOKEN", "").strip()
