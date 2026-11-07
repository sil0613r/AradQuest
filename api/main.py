"""ARAD QUEST game API: accounts and login sessions, stored in PostgreSQL (table jucatori).

Run locally with: uvicorn main:app --reload --port 8001
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from psycopg import errors as pg_errors
from pydantic import BaseModel, EmailStr, Field, field_validator
from starlette.middleware.sessions import SessionMiddleware

import settings
from db import pool
from security import MAX_PASSWORD_BYTES, hash_password, verify_password

DEFAULT_AVATAR_ID = 1   # jucatori.avatar_id must be 1-4; 1 = Explorer. Players choose later.
USER_COLUMNS = "player_id, username, email, total_points"


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
    allow_methods=["GET", "POST"],
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


def public_user(row: dict) -> dict:
    """The user shape the frontend stores. Never includes the password hash."""
    return {
        "id": row["player_id"],
        "username": row["username"],
        "email": row["email"],
        "total_points": row["total_points"],
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
            f"SELECT {USER_COLUMNS} FROM jucatori WHERE player_id = %s", (user_id,)
        ).fetchone()

    if row is None:   # account was deleted while the cookie was still valid
        request.session.clear()
        raise HTTPException(401, "Not logged in")
    return {"user": public_user(row)}


@app.post("/auth/logout")
def logout(request: Request):
    request.session.clear()
    return {"status": "ok"}
