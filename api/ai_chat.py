"""POST /ai/chat (Arad_Quest_Backend_API_Specificatie.docx, endpoint 13).

The chat runs in the chatbot service (ai_bot). The browser never talks to it directly, and the AI key
stays on the server. The chatbot answers for the player's current location of the adventure and does
not reveal the accepted answers.
"""
import json
import urllib.error
import urllib.request
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

import game
import settings
from adventures import route_or_404
from db import pool
from deps import require_user_id

router = APIRouter()

SUGGESTIONS = ["Another hint", "About this place"]

# (player ID, mission key) -> chatbot session ID. The chatbot keeps the session's conversation.
_sessions: dict[tuple[int, str], str] = {}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    adventureId: int = Field(ge=1)
    language: Literal["en", "ro"] = "en"


def _post(path: str, payload: dict) -> dict:
    """POST to the chatbot service. HTTP errors are raised as urllib.error.HTTPError for the caller to handle."""
    req = urllib.request.Request(
        f"{settings.BOT_INTERNAL_URL}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def _unavailable() -> HTTPException:
    return HTTPException(502, "The chatbot is unavailable")


def _start_session(mission_key: str, user_id: int) -> str:
    try:
        session_id = _post("/api/bot/start", {"mission_id": mission_key})["session_id"]
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise _unavailable()
    _sessions[(user_id, mission_key)] = session_id
    return session_id


def _reply(mission_key: str, user_id: int, message: str) -> str:
    if not settings.BOT_INTERNAL_URL:
        raise HTTPException(503, "The chatbot is not configured")
    # Try once with the stored session, and once more with a new session if the chatbot forgot it.
    for attempt in (1, 2):
        session_id = _sessions.get((user_id, mission_key)) or _start_session(mission_key, user_id)
        try:
            return _post("/api/bot/chat", {"session_id": session_id, "message": message})["reply"]
        except urllib.error.HTTPError as err:
            _sessions.pop((user_id, mission_key), None)
            if err.code == 429:
                raise HTTPException(429, "Too many messages, wait a minute")
            if err.code != 404 or attempt == 2:
                raise _unavailable()
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
            raise _unavailable()
    raise _unavailable()


@router.post("/ai/chat")
def chat(body: ChatRequest, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        route_or_404(conn, body.adventureId)
        rows = game.route_mission_rows(conn, body.adventureId, user_id)

    current = next((r for r in rows if r["progress_status"] != "completed"), None)
    if current is None:
        raise HTTPException(409, "This adventure has no open location to talk about")
    mission_key = game.OBJECTIVE_MISSION_KEYS.get(current["name"])
    if mission_key is None:
        raise HTTPException(409, "The chatbot has no notes for this location")

    reply = _reply(mission_key, user_id, body.message)
    return {"reply": reply, "language": body.language, "suggestions": SUGGESTIONS}
