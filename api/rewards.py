"""GET /rewards (Arad_Quest_Backend_API_Specificatie.docx, endpoint 14).

The rewards are demonstration rewards. There is no claim endpoint in the MVP, so canRedeem is always false.
"""
from fastapi import APIRouter, HTTPException, Request

from db import pool
from deps import require_user_id

router = APIRouter()


@router.get("/rewards")
def list_rewards(request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        user = conn.execute("SELECT total_points FROM jucatori WHERE player_id = %s", (user_id,)).fetchone()
        if user is None:
            request.session.clear()
            raise HTTPException(401, "Not logged in")
        rows = conn.execute(
            "SELECT reward_id, name, description, points_cost, quantity_available, is_active "
            "FROM recompense_disponibile ORDER BY points_cost, reward_id"
        ).fetchall()
    return {
        "userPoints": user["total_points"],
        "rewards": [
            {
                "id": row["reward_id"],
                "title": row["name"],
                "description": row["description"],
                "pointsRequired": row["points_cost"],
                "quantityAvailable": row["quantity_available"],
                "isActive": row["is_active"],
                "status": "available" if row["is_active"] else "coming_soon",
                "canRedeem": False,
            }
            for row in rows
        ],
    }
