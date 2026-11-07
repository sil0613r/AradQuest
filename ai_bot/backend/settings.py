"""Everything you are likely to change lives here (or in prompts.py and missions.json)."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()   # reads backend/.env (OPENAI_API_KEY, ALLOWED_ORIGINS)

# ---- Model ----
MODEL = "gpt-5-nano"                  # any model that supports structured outputs
REASONING_EFFORT = "low"           # "low" / "medium" / "high". Use None for non-reasoning models
USE_WEB_SEARCH = False

# ---- Data ----
MISSIONS_FILE = Path(__file__).parent / "missions.json"   # missions, answers and hints (server only)

# ---- Bot behaviour ----
HISTORY_MESSAGES = 8               # recent chat messages the bot remembers
MAX_EXTRA_HINTS = 2                # hints the bot may invent after the written ones run out
MAX_RETRIES = 3                    # regeneration attempts if a reply would leak the answer

FALLBACK_REPLY = (
    "The mist thickens around that thought, traveler. Ask me another way. / "
    "Ceața se îngroașă în jurul gândului acesta, călătorule. Întreabă-mă altfel."
)
GAME_RULES = (   # EDIT to match your real rules
    "Players walk to real places in Arad, read the mission, find the password on site "
    "and type it into the answer box to earn points. Hints from the narrator are optional."
)
ANSWER_BOX = "the answer box on the mission screen"   # EDIT: must match the label of your answer field
ANSWER_ATTEMPT_FALLBACK = (
    "Answers are written in the answer box on the mission screen, traveler. / "
    "Răspunsurile se scriu în câmpul de răspuns de pe ecranul misiunii, călătorule."
)

# ---- Server ----
# Shared secret between the game API and this service (private network only). Empty = internal route off.
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5500").split(",") if o.strip()]
RATE_LIMIT_PER_MINUTE = 20         # chat messages per IP per minute
SESSION_TTL_SECONDS = 2 * 60 * 60  # idle chats are dropped after 2 hours
