"""Adventure endpoints from the API contract (Arad_Quest_Backend_API_Specificatie.docx, endpoints 6-10 and 12).

An adventure is a route in trasee_tematice. Its locations are the objectives in
ordine_obiective_traseu, in sequence order. Locations unlock one by one: the player must
complete them in order. Routes use database IDs, which are looked up by title in the database
seed and never hard-coded here.

Mission texts and clues come from the chatbot service (ai_bot/backend/missions.json).
Nothing here returns the accepted answers, and the map does not list locations the player has not reached.
"""
from fastapi import APIRouter, HTTPException, Request

import game
from db import pool
from deps import iso_utc, require_user_id

router = APIRouter(prefix="/adventures")


def route_or_404(conn, route_id: int) -> dict:
    row = conn.execute(
        "SELECT route_id, title, description, difficulty, estimated_minutes, is_active "
        "FROM trasee_tematice WHERE route_id = %s",
        (route_id,),
    ).fetchone()
    if row is None or not row["is_active"]:
        raise HTTPException(404, "Adventure not found")
    return row


def _started_row(conn, user_id: int, route_id: int) -> dict | None:
    return conn.execute(
        "SELECT status, started_at FROM progres_jucatori_trasee WHERE player_id = %s AND route_id = %s",
        (user_id, route_id),
    ).fetchone()


def _user_status(started: dict | None) -> str:
    if started is None:
        return "not_started"
    return "completed" if started["status"] == "completed" else "in_progress"


@router.get("")
def list_adventures(request: Request):
    user_id = request.session.get("user_id")   # the list is public; statuses need a login
    with pool.connection() as conn:
        routes = conn.execute(
            "SELECT route_id, title, description, difficulty, estimated_minutes "
            "FROM trasee_tematice WHERE is_active ORDER BY route_id"
        ).fetchall()
        adventures = []
        for route in routes:
            started = _started_row(conn, user_id, route["route_id"]) if user_id is not None else None
            adventures.append({
                "id": route["route_id"],
                "title": route["title"],
                "description": route["description"],
                "difficulty": route["difficulty"],
                "estimatedMinutes": route["estimated_minutes"],
                "isActive": True,
                "userStatus": _user_status(started),
            })
    return {"adventures": adventures}


@router.get("/{adventure_id}")
def adventure_details(adventure_id: int):
    with pool.connection() as conn:
        route = route_or_404(conn, adventure_id)
        rows = game.route_mission_rows(conn, adventure_id, None)
    return {
        "id": route["route_id"],
        "title": route["title"],
        "description": route["description"],
        "difficulty": route["difficulty"],
        "estimatedMinutes": route["estimated_minutes"],
        "totalLocations": len(rows),
        "maxPoints": sum(r["points_reward"] or 0 for r in rows),
        "rules": {"requiresGPS": True, "progressiveUnlock": True},
    }


@router.post("/{adventure_id}/start")
def start_adventure(adventure_id: int, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        route_or_404(conn, adventure_id)
        inserted = conn.execute(
            "INSERT INTO progres_jucatori_trasee (player_id, route_id, status) "
            "VALUES (%s, %s, 'in_progress') ON CONFLICT DO NOTHING RETURNING status, started_at",
            (user_id, adventure_id),
        ).fetchone()
        if inserted is not None:
            row, resumed = inserted, False
        else:   # already started: resuming never resets progress
            row, resumed = _started_row(conn, user_id, adventure_id), True
    if row is None:
        raise HTTPException(409, "Could not start the adventure, try again")
    return {
        "adventureId": adventure_id,
        "status": row["status"],
        "startedAt": iso_utc(row["started_at"]),
        "resumed": resumed,
    }


@router.get("/{adventure_id}/progress")
def adventure_progress(adventure_id: int, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        route_or_404(conn, adventure_id)
        started = _started_row(conn, user_id, adventure_id)
        rows = game.route_mission_rows(conn, adventure_id, user_id)
    done = [r for r in rows if r["progress_status"] == "completed"]
    total = len(rows)
    return {
        "adventureId": adventure_id,
        "status": _user_status(started),
        "completedLocations": len(done),
        "totalLocations": total,
        "earnedPoints": sum(r["points_awarded"] for r in done),
        "progressPercentage": round(100 * len(done) / total, 2) if total else 0,
        "completedLocationIds": [r["objective_id"] for r in done],
        "adventureCompleted": total > 0 and len(done) == total,
    }


@router.get("/{adventure_id}/current-clue")
def current_clue(adventure_id: int, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        route_or_404(conn, adventure_id)
        rows = game.route_mission_rows(conn, adventure_id, user_id)

    current = next((r for r in rows if r["progress_status"] != "completed"), None)
    if current is None:
        return {"adventureId": adventure_id, "mission": None, "clue": None, "adventureCompleted": bool(rows)}

    # The clue is the latest hint the player paid for (text from missions.json). None until one is opened.
    clue = None
    hints_used = current["hints_used"]
    if hints_used > 0:
        key = game.OBJECTIVE_MISSION_KEYS.get(current["name"])
        if key is not None:
            clues = game.bot_mission(key)["clues"]
            if hints_used <= len(clues):
                clue = {"id": hints_used, "text": clues[hints_used - 1], "order": hints_used}

    return {
        "adventureId": adventure_id,
        "mission": {
            "id": current["mission_id"],
            "title": current["title"],
            "description": current["description"],
            "pointsReward": current["points_reward"] or 0,
        },
        "clue": clue,
        "adventureCompleted": False,
    }


@router.get("/{adventure_id}/map")
def adventure_map(adventure_id: int, request: Request):
    """Only the locations the player has completed. The current destination is not sent (see the note in the docs)."""
    user_id = require_user_id(request)
    with pool.connection() as conn:
        route_or_404(conn, adventure_id)
        rows = game.route_mission_rows(conn, adventure_id, user_id)
    completed = [
        {
            "id": r["objective_id"],
            "name": r["name"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "status": "completed",
        }
        for r in rows
        if r["progress_status"] == "completed"
    ]
    return {
        "adventureId": adventure_id,
        "completedLocations": completed,
        "currentLocation": None,
        "totalLocations": len(rows),
    }
