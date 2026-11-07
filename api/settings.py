"""Settings read from environment variables (see .env.example)."""
import os

from dotenv import load_dotenv

load_dotenv()   # reads api/.env when running locally; Railway sets real variables instead


def _required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


DATABASE_URL = _required("DATABASE_URL")          # postgresql://user:password@host:port/arad_quest
SESSION_SECRET = _required("SESSION_SECRET")      # long random string, signs the login cookie

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"   # true on HTTPS deployments
SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
