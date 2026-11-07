"""ARAD QUEST game API: accounts and login sessions, stored in PostgreSQL (table jucatori).

Run locally with: uvicorn main:app --reload --port 8001
"""
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from psycopg import errors as pg_errors
from psycopg import sql
from psycopg.types.json import Jsonb
from pydantic import BaseModel, EmailStr, Field, field_validator
from starlette.middleware.sessions import SessionMiddleware

import ai_chat
import adventures
import game
import rewards
import settings
from db import pool
from deps import iso_utc, require_user_id
from user_profile import profile_summary
from security import MAX_PASSWORD_BYTES, hash_password, verify_password

DEFAULT_AVATAR_ID = 1   # jucatori.avatar_id must be 1-4; 1 = Explorer. Players choose later.
AVATAR_KEYS = {1: "explorer", 2: "adventurer", 3: "champion", 4: "pathfinder"}   # same order as the React app
AVATAR_IDS = {key: avatar_id for avatar_id, key in AVATAR_KEYS.items()}
USER_COLUMNS = "player_id, username, email, total_points, avatar_id"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # wait=True: fail at startup (and let Railway show the error) if the database is unreachable.
    pool.open(wait=True, timeout=30)
    yield
    pool.close()


app = FastAPI(title="ARAD QUEST game API", lifespan=lifespan)

# Added first so that CORS (added last) is the outer layer and also decorates error responses.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    session_cookie="aradquest_session",
    max_age=settings.SESSION_MAX_AGE_SECONDS,
    same_site="lax",
    https_only=settings.COOKIE_SECURE,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,   # exact origins only: credentials are not allowed with "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH"],
    allow_headers=["Content-Type"],
)


class RegisterRequest(BaseModel):
    # Field names match what the React app sends (authService.js).
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    parola: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str) -> str:
        value = value.strip()
        if not 3 <= len(value) <= 50:
            raise ValueError("Username must be 3 to 50 characters")
        return value

    @field_validator("email")
    @classmethod
    def limit_email(cls, value: str) -> str:
        if len(value) > 100:
            raise ValueError("Email is too long")
        return value

    @field_validator("parola")
    @classmethod
    def limit_password(cls, value: str) -> str:
        if len(value.encode()) > MAX_PASSWORD_BYTES:
            raise ValueError("Password is too long")
        return value


class LoginRequest(BaseModel):
    email: str = Field(min_length=1, max_length=100)
    parola: str = Field(min_length=1)


class UpdateProfileRequest(BaseModel):
    # Only the fields that are sent get changed.
    username: str | None = None
    email: EmailStr | None = None
    avatar: Literal["explorer", "adventurer", "champion", "pathfinder"] | None = None

    @field_validator("username")
    @classmethod
    def strip_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not 3 <= len(value) <= 50:
            raise ValueError("Username must be 3 to 50 characters")
        return value


class UserSettings(BaseModel):
    # The notification switches on the Settings page.
    adventureUpdates: bool = True
    rewards: bool = True
    announcements: bool = False


def public_user(row: dict) -> dict:
    """The user shape the frontend stores. Never includes the password hash."""
    return {
        "id": row["player_id"],
        "username": row["username"],
        "email": row["email"],
        "total_points": row["total_points"],
        "avatar": AVATAR_KEYS[row["avatar_id"]],
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/health/db")
def health_db():
    try:
        with pool.connection() as conn:
            conn.execute("SELECT 1")
    except Exception:
        raise HTTPException(503, "Database unavailable")
    return {"ok": True}


@app.post("/auth/register")
def register(body: RegisterRequest):
    try:
        with pool.connection() as conn:
            row = conn.execute(
                "INSERT INTO jucatori (username, email, password_hash, avatar_id) "
                "VALUES (%s, %s, %s, %s) RETURNING player_id",
                (body.username, body.email.lower(), hash_password(body.parola), DEFAULT_AVATAR_ID),
            ).fetchone()
    except pg_errors.UniqueViolation:
        # Username or email already taken. The frontend shows the same message for both.
        raise HTTPException(409, "An account with this email already exists")
    return {"status": "succes", "user_id": row["player_id"]}


@app.post("/auth/login")
def login(body: LoginRequest, request: Request):
    with pool.connection() as conn:
        row = conn.execute(
            f"SELECT {USER_COLUMNS}, password_hash FROM jucatori WHERE email = %s",
            (body.email.strip().lower(),),
        ).fetchone()

    if row is None or not verify_password(body.parola, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    request.session.clear()
    request.session["user_id"] = row["player_id"]
    return {"user": public_user(row)}


@app.get("/users/me")
def me(request: Request):
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(401, "Not logged in")

    with pool.connection() as conn:
        row = conn.execute(
            f"SELECT {USER_COLUMNS}, created_at FROM jucatori WHERE player_id = %s", (user_id,)
        ).fetchone()
        if row is None:   # account was deleted while the cookie was still valid
            request.session.clear()
            raise HTTPException(401, "Not logged in")
        counts = conn.execute(
            "SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed, "
            "COUNT(*) FILTER (WHERE status = 'in_progress') AS active "
            "FROM progres_jucatori_trasee WHERE player_id = %s",
            (user_id,),
        ).fetchone()
        profile = profile_summary(conn, user_id, row["total_points"])

    return {
        "user": public_user(row),
        "completedAdventures": counts["completed"],
        "activeAdventures": counts["active"],
        "joinedAt": iso_utc(row["created_at"]),   # from the database: the time the account was created
        "profile": profile,                        # stats, adventure history and badges, for the profile page
    }


class AvatarRequest(BaseModel):
    # API contract, endpoint 5: an integer from 1 to 4.
    avatarId: int = Field(ge=1, le=4)


@app.patch("/users/me/avatar")
def update_avatar(body: AvatarRequest, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        row = conn.execute(
            "UPDATE jucatori SET avatar_id = %s WHERE player_id = %s RETURNING player_id",
            (body.avatarId, user_id),
        ).fetchone()
    if row is None:   # account was deleted while the cookie was still valid
        request.session.clear()
        raise HTTPException(401, "Not logged in")
    return {"success": True, "avatarId": body.avatarId}


@app.post("/auth/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}


@app.patch("/users/me")
def update_me(body: UpdateProfileRequest, request: Request):
    user_id = require_user_id(request)

    changes = {}
    if body.username is not None:
        changes["username"] = body.username
    if body.email is not None:
        changes["email"] = body.email.lower()
    if body.avatar is not None:
        changes["avatar_id"] = AVATAR_IDS[body.avatar]

    try:
        with pool.connection() as conn:
            if changes:
                assignments = sql.SQL(", ").join(
                    sql.SQL("{} = %s").format(sql.Identifier(column)) for column in changes
                )
                row = conn.execute(
                    sql.SQL("UPDATE jucatori SET {} WHERE player_id = %s RETURNING {}").format(
                        assignments, sql.SQL(USER_COLUMNS)
                    ),
                    (*changes.values(), user_id),
                ).fetchone()
            else:
                row = conn.execute(
                    f"SELECT {USER_COLUMNS} FROM jucatori WHERE player_id = %s", (user_id,)
                ).fetchone()
    except pg_errors.UniqueViolation:
        raise HTTPException(409, "Username or email already taken")

    if row is None:   # account was deleted while the cookie was still valid
        request.session.clear()
        raise HTTPException(401, "Not logged in")
    return {"user": public_user(row)}


@app.get("/users/me/settings")
def get_settings(request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT settings FROM setari_jucatori WHERE player_id = %s", (user_id,)
        ).fetchone()
    stored = UserSettings.model_validate(row["settings"]) if row else UserSettings()
    return {"settings": stored}


@app.put("/users/me/settings")
def put_settings(body: UserSettings, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO setari_jucatori (player_id, settings) VALUES (%s, %s) "
            "ON CONFLICT (player_id) DO UPDATE SET settings = EXCLUDED.settings, "
            "updated_at = CURRENT_TIMESTAMP",
            (user_id, Jsonb(body.model_dump())),
        )
    return {"settings": body}


# Routes for the API contract and the React app. Paths have no /api prefix: nginx adds it in Docker.
app.include_router(game.router)        # answer checks, hints, progress (React app)
app.include_router(adventures.router)  # /adventures, start, progress, current clue, map
app.include_router(rewards.router)     # /rewards
app.include_router(ai_chat.router)     # /ai/chat
