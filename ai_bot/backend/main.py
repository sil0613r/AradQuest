"""FastAPI app: two endpoints for the chat widget. Run with: uvicorn main:app --reload"""
import logging
import time
import uuid
from collections import defaultdict, deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import settings
from bot import GameSession, load_missions, take_turn

log = logging.getLogger("arad-quest")
app = FastAPI(title="ARAD QUEST chatbot")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,   # set ALLOWED_ORIGINS in .env
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

MISSIONS = load_missions()                                  # stays on the server
SESSIONS: dict[str, tuple[GameSession, float]] = {}         # session_id -> (session, last used)
HITS: dict[str, deque] = defaultdict(deque)                 # ip -> recent request times


class StartRequest(BaseModel):
    mission_id: str


class StartResponse(BaseModel):
    session_id: str
    title: str


class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str


def drop_old_sessions() -> None:
    cutoff = time.time() - settings.SESSION_TTL_SECONDS
    for sid in [s for s, (_, used) in SESSIONS.items() if used < cutoff]:
        del SESSIONS[sid]


def check_rate(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"   # behind a proxy this is the proxy's IP
    now, hits = time.time(), HITS[ip]
    while hits and now - hits[0] > 60:
        hits.popleft()
    if len(hits) >= settings.RATE_LIMIT_PER_MINUTE:
        raise HTTPException(429, "Too many messages")
    hits.append(now)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/bot/start", response_model=StartResponse)
def start(req: StartRequest):
    if req.mission_id not in MISSIONS:
        raise HTTPException(404, "Unknown mission")
    drop_old_sessions()
    mission, blocked = MISSIONS[req.mission_id]
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = (GameSession(mission, blocked), time.time())
    return StartResponse(session_id=session_id, title=mission.title)   # no answers, no hints


@app.post("/api/bot/chat", response_model=ChatResponse)
def chat(req: ChatRequest, request: Request):
    entry = SESSIONS.get(req.session_id)
    if entry is None:
        raise HTTPException(404, "Session not found")
    message = req.message.strip()
    if not message:
        raise HTTPException(422, "Empty message")
    check_rate(request)
    session = entry[0]
    try:
        reply = take_turn(session, message)
    except Exception:
        log.exception("take_turn failed")
        raise HTTPException(502, "Chatbot temporarily unavailable")
    SESSIONS[req.session_id] = (session, time.time())
    return ChatResponse(reply=reply)
