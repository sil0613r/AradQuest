"""Small helpers shared by the route modules."""
from fastapi import HTTPException, Request


def require_user_id(request: Request) -> int:
    """Return the logged-in player's ID, or stop with 401 when nobody is logged in."""
    user_id = request.session.get("user_id")
    if user_id is None:
        raise HTTPException(401, "Not logged in")
    return user_id
