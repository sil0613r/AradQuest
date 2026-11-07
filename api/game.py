"""Game rules: checking a location's answer and GPS, and saving the player's progress.

The React app uses its own location IDs (for example "primaria-arad"). Each one maps to one
objective in the database. Each objective has one mission, and each mission has accepted answers.
Ported from the teammate's /api/validare-nivel (backend_main.py), with the progress and points saved.
"""
import json
import unicodedata
import urllib.error
import urllib.request
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

import settings
from db import pool
from deps import require_user_id

router = APIRouter()

# Frontend location ID -> objective name in obiective_turistice (see database/02_insert_data.sql).
LOCATION_OBJECTIVES = {
    "nature-location-1": "Parcul Micalaca - Zona 300",
    "primaria-arad": "Primaria Arad",
    "teatrul-ioan-slavici": "Teatrul Clasic Ioan Slavici",
    "biserica-rosie": "Biserica Rosie",
    "moise-nicoara": "Colegiul National Moise Nicoara",
    "palatul-cultural": "Filarmonica",
    "vechiul-cazino": "Vechiul Cazinou",
}
OBJECTIVE_LOCATIONS = {name: location for location, name in LOCATION_OBJECTIVES.items()}

# Frontend adventure ID -> route title in trasee_tematice.
ADVENTURE_ROUTES = {"nature": "Traseul in natura", "history": "Descopera Aradul"}


class ValidateRequest(BaseModel):
    locationId: str = Field(min_length=1, max_length=60)
    answer: str = Field(min_length=1, max_length=500)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class HintRequest(BaseModel):
    locationId: str = Field(min_length=1, max_length=60)


# Points taken for each hint the player opens. Taken from the total when the hint is opened.
HINT_COST = 10

# Frontend location ID -> mission key in ai_bot/backend/missions.json (the only place clue text lives).
LOCATION_MISSIONS = {
    "nature-location-1": "parcul_micalaca",
    "primaria-arad": "primaria",
    "teatrul-ioan-slavici": "teatrul_slavici",
    "biserica-rosie": "biserica_rosie",
    "moise-nicoara": "colegiul_moise_nicoara",
    "palatul-cultural": "filarmonica",
    "vechiul-cazino": "vechiul_cazinou",
}


def normalize_answer(text: str) -> str:
    """Ignore case, extra spaces and Romanian diacritics: "Ioan", " ioan " and "Ioán" all match."""
    decomposed = unicodedata.normalize("NFKD", text.strip().casefold())
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return " ".join(without_marks.split())


def route_completed(conn, user_id: int, objective_id: int) -> bool:
    """True when every mission of the route containing this objective is completed. Saves that result."""
    row = conn.execute(
        """
        SELECT ot.route_id,
               COUNT(*) AS total,
               COUNT(p.mission_id) FILTER (WHERE p.status = 'completed') AS done
        FROM ordine_obiective_traseu ot
        JOIN misiuni m ON m.objective_id = ot.objective_id AND m.is_active
        LEFT JOIN progres_jucatori_misiuni p
               ON p.mission_id = m.mission_id AND p.player_id = %s
        WHERE ot.route_id = (SELECT route_id FROM ordine_obiective_traseu
                             WHERE objective_id = %s LIMIT 1)
        GROUP BY ot.route_id
        """,
        (user_id, objective_id),
    ).fetchone()
    if row is None or row["total"] == 0 or row["done"] != row["total"]:
        return False

    conn.execute(
        "INSERT INTO progres_jucatori_trasee (player_id, route_id, status, completed_at) "
        "VALUES (%s, %s, 'completed', CURRENT_TIMESTAMP) "
        "ON CONFLICT (player_id, route_id) DO UPDATE SET status = 'completed', "
        "completed_at = COALESCE(progres_jucatori_trasee.completed_at, EXCLUDED.completed_at)",
        (user_id, row["route_id"]),
    )
    return True


@router.post("/validare-nivel")
def validate_location(body: ValidateRequest, request: Request):
    user_id = require_user_id(request)
    objective_name = LOCATION_OBJECTIVES.get(body.locationId)
    if objective_name is None:
        raise HTTPException(404, "Unknown location")

    with pool.connection() as conn:
        # One row: the objective, its mission, its radius, the distance from the player, and the accepted answers.
        target = conn.execute(
            """
            SELECT o.objective_id, o.radius_meters, m.mission_id, m.points_reward,
                   ST_Distance(o.location,
                               ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS distance_m,
                   ARRAY(SELECT rc.accepted_answer FROM raspunsuri_corecte rc
                         WHERE rc.mission_id = m.mission_id) AS accepted_answers
            FROM obiective_turistice o
            JOIN misiuni m ON m.objective_id = o.objective_id
            WHERE o.name = %s AND o.is_active AND m.is_active
            """,
            (body.longitude, body.latitude, objective_name),
        ).fetchone()
        if target is None:
            raise HTTPException(404, "This location has no active mission")

        distance = float(target["distance_m"])
        if distance > target["radius_meters"]:
            return _result(
                gps_valid=False,
                message=f"You are {round(distance)} m away. Move closer to the location.",
                total=_total_points(conn, user_id),
            )

        accepted = {normalize_answer(answer) for answer in target["accepted_answers"]}
        is_correct = normalize_answer(body.answer) in accepted

        # Create the progress row first: attempts reference it.
        conn.execute(
            "INSERT INTO progres_jucatori_misiuni (player_id, mission_id) VALUES (%s, %s) "
            "ON CONFLICT DO NOTHING",
            (user_id, target["mission_id"]),
        )
        status = conn.execute(
            "SELECT status FROM progres_jucatori_misiuni WHERE player_id = %s AND mission_id = %s FOR UPDATE",
            (user_id, target["mission_id"]),
        ).fetchone()["status"]

        if status == "completed":
            return _result(
                gps_valid=True,
                answer_correct=True,
                mission_completed=True,
                message="You already completed this location.",
                total=_total_points(conn, user_id),
            )

        conn.execute(
            "INSERT INTO raspunsuri_trimise (player_id, mission_id, answer_text, is_correct) "
            "VALUES (%s, %s, %s, %s)",
            (user_id, target["mission_id"], body.answer, is_correct),
        )

        if not is_correct:
            return _result(
                gps_valid=True,
                message="You are at the right place, but the answer is wrong.",
                total=_total_points(conn, user_id),
            )

        points = target["points_reward"] or 0
        conn.execute(
            "UPDATE progres_jucatori_misiuni SET status = 'completed', completed_at = CURRENT_TIMESTAMP, "
            "points_awarded = %s WHERE player_id = %s AND mission_id = %s",
            (points, user_id, target["mission_id"]),
        )
        total = conn.execute(
            "UPDATE jucatori SET total_points = total_points + %s WHERE player_id = %s RETURNING total_points",
            (points, user_id),
        ).fetchone()["total_points"]
        adventure_completed = route_completed(conn, user_id, target["objective_id"])

    return _result(
        gps_valid=True,
        answer_correct=True,
        mission_completed=True,
        earned=points,
        total=total,
        adventure_completed=adventure_completed,
        message="Correct! Location completed.",
    )


@router.get("/progress")
def get_progress(request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT o.name
            FROM progres_jucatori_misiuni p
            JOIN misiuni m ON m.mission_id = p.mission_id
            JOIN obiective_turistice o ON o.objective_id = m.objective_id
            WHERE p.player_id = %s AND p.status = 'completed'
            """,
            (user_id,),
        ).fetchall()
        total = _total_points(conn, user_id)
    completed = [OBJECTIVE_LOCATIONS[row["name"]] for row in rows if row["name"] in OBJECTIVE_LOCATIONS]
    return {"completedLocations": completed, "totalPoints": total}


def _bot_mission(mission_key: str) -> dict:
    """Mission text and hint list from the chatbot service (private network, shared token)."""
    if not settings.BOT_INTERNAL_URL or not settings.BOT_INTERNAL_TOKEN:
        raise HTTPException(503, "Hints are not configured")
    req = urllib.request.Request(
        f"{settings.BOT_INTERNAL_URL}/internal/missions/{mission_key}",
        headers={"X-Internal-Token": settings.BOT_INTERNAL_TOKEN},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise HTTPException(502, "The hint service is unavailable")


def _location_mission_id(conn, location_id: str) -> int:
    objective_name = LOCATION_OBJECTIVES.get(location_id)
    if objective_name is None:
        raise HTTPException(404, "Unknown location")
    row = conn.execute(
        """
        SELECT m.mission_id
        FROM misiuni m
        JOIN obiective_turistice o ON o.objective_id = m.objective_id
        WHERE o.name = %s AND m.is_active
        LIMIT 1
        """,
        (objective_name,),
    ).fetchone()
    if row is None:
        raise HTTPException(404, "This location has no active mission")
    return row["mission_id"]


@router.get("/locations/{location_id}/mission")
def get_mission(location_id: str, request: Request):
    """Title and riddle text for a location, plus the hints the player has already paid for."""
    user_id = require_user_id(request)
    mission_key = LOCATION_MISSIONS.get(location_id)
    if mission_key is None:
        raise HTTPException(404, "Unknown location")
    with pool.connection() as conn:
        mission_id = _location_mission_id(conn, location_id)
        row = conn.execute(
            "SELECT status, hints_used FROM progres_jucatori_misiuni WHERE player_id = %s AND mission_id = %s",
            (user_id, mission_id),
        ).fetchone()
    hints_used = row["hints_used"] if row else 0
    data = _bot_mission(mission_key)
    return {
        "title": data["title"],
        "description": data["description"],
        "clueCount": len(data["clues"]),
        "hintsUsed": hints_used,
        "hints": data["clues"][:hints_used],
        "hintCost": HINT_COST,
        "completed": bool(row) and row["status"] == "completed",
    }


@router.post("/hints/next")
def next_hint(body: HintRequest, request: Request):
    """Open the next hint for a location. Costs HINT_COST points, taken from the total right away."""
    user_id = require_user_id(request)
    mission_key = LOCATION_MISSIONS.get(body.locationId)
    if mission_key is None:
        raise HTTPException(404, "Unknown location")
    with pool.connection() as conn:
        mission_id = _location_mission_id(conn, body.locationId)
        conn.execute(
            "INSERT INTO progres_jucatori_misiuni (player_id, mission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (user_id, mission_id),
        )
        # Lock the row so two quick clicks cannot charge twice for the same hint.
        row = conn.execute(
            "SELECT status, hints_used FROM progres_jucatori_misiuni "
            "WHERE player_id = %s AND mission_id = %s FOR UPDATE",
            (user_id, mission_id),
        ).fetchone()
        if row["status"] == "completed":
            raise HTTPException(409, "You already solved this location")
        clues = _bot_mission(mission_key)["clues"]
        used = row["hints_used"]
        if used >= len(clues):
            raise HTTPException(409, "There are no more hints for this location")
        if _total_points(conn, user_id) < HINT_COST:
            raise HTTPException(409, f"You need {HINT_COST} points to open a hint")
        total = conn.execute(
            "UPDATE jucatori SET total_points = total_points - %s WHERE player_id = %s RETURNING total_points",
            (HINT_COST, user_id),
        ).fetchone()["total_points"]
        conn.execute(
            "UPDATE progres_jucatori_misiuni SET hints_used = hints_used + 1 "
            "WHERE player_id = %s AND mission_id = %s",
            (user_id, mission_id),
        )
    return {"hint": clues[used], "hintsUsed": used + 1, "totalPoints": total, "hintCost": HINT_COST}


def _total_points(conn, user_id: int) -> int:
    row = conn.execute("SELECT total_points FROM jucatori WHERE player_id = %s", (user_id,)).fetchone()
    if row is None:
        raise HTTPException(401, "Not logged in")
    return row["total_points"]


def _result(
    *,
    gps_valid: bool,
    total: int,
    message: str,
    answer_correct: bool = False,
    mission_completed: bool = False,
    earned: int = 0,
    adventure_completed: bool = False,
) -> dict:
    """The result shape the React app expects (same field names as the teammate's route)."""
    return {
        "success": mission_completed,
        "answerCorrect": answer_correct,
        "gpsValid": gps_valid,
        "missionCompleted": mission_completed,
        "earnedPoints": earned,
        "totalPoints": total,
        "adventureCompleted": adventure_completed,
        "message": message,
    }
