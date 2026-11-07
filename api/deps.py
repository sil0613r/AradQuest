"""Small helpers shared by the route modules."""
from datetime import datetime

from fastapi import HTTPException, Request


def require_user_id(request: Request) -> int:
    """Return the logged-in player's ID, or stop with 401 when nobody is logged in."""
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(401, "Not logged in")
    return user_id


def iso_utc(value: datetime | None) -> str | None:
    """Timestamps are stored without a time zone and returned as UTC, ISO 8601 with a trailing Z."""
    return value.isoformat() + "Z" if value else None
