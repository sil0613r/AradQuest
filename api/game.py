"""Game rules: checking a location's answer and GPS, and saving the player's progress.

Two request shapes use the same checks:
- ValidateRequest: the React app, with its own location IDs (for example "primaria-arad").
- AdventureValidateRequest: the API contract (Arad_Quest_Backend_API_Specificatie.docx, endpoint 11),
  with database IDs (adventureId, missionId).

Each location maps to one objective in the database. Each objective has one mission, and each
mission has accepted answers.
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
    "nature-location-2": "Parcul Europa",
    "nature-location-3": "Parcul de la Podgoria",
    "nature-location-4": "Parcul Copiilor",
    "nature-location-5": "Faleza Muresului - zona Gloria (Tenis Club Pro)",
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
    """Body sent by the React app."""

    locationId: str = Field(min_length=1, max_length=60)
    answer: str = Field(min_length=1, max_length=500)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class AdventureValidateRequest(BaseModel):
    """Body from the API contract (endpoint 11)."""

    adventureId: int = Field(ge=1)
    missionId: int = Field(ge=1)
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
    "nature-location-2": "parcul_europa",
    "nature-location-3": "parcul_podgoria",
    "nature-location-4": "parcul_copiilor",
    "nature-location-5": "faleza_gloria",
    "primaria-arad": "primaria",
    "teatrul-ioan-slavici": "teatrul_slavici",
    "biserica-rosie": "biserica_rosie",
    "moise-nicoara": "colegiul_moise_nicoara",
    "palatul-cultural": "filarmonica",
    "vechiul-cazino": "vechiul_cazinou",
}
# Objective name -> mission key, for the routes that work with database IDs.
OBJECTIVE_MISSION_KEYS = {LOCATION_OBJECTIVES[loc]: key for loc, key in LOCATION_MISSIONS.items()}


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


# One row per mission of a route, in route order, with the player's progress on it (NULL when none).
# The player ID may be NULL (anonymous request): then no progress matches and every mission is open.
ROUTE_MISSIONS_SQL = """
    SELECT ot.sequence_number, o.objective_id, o.name,
           ST_Y(o.location::geometry) AS latitude, ST_X(o.location::geometry) AS longitude,
           m.mission_id, m.title, m.description, m.points_reward,
           p.status AS progress_status, COALESCE(p.hints_used, 0) AS hints_used,
           COALESCE(p.points_awarded, 0) AS points_awarded
    FROM ordine_obiective_traseu ot
    JOIN obiective_turistice o ON o.objective_id = ot.objective_id AND o.is_active
    JOIN misiuni m ON m.objective_id = o.objective_id AND m.is_active
    LEFT JOIN progres_jucatori_misiuni p
           ON p.mission_id = m.mission_id AND p.player_id = %s
    WHERE ot.route_id = %s
    ORDER BY ot.sequence_number, m.mission_id
"""


def route_mission_rows(conn, route_id: int, user_id: int | None) -> list[dict]:
    return conn.execute(ROUTE_MISSIONS_SQL, (user_id, route_id)).fetchall()


def route_of_objective(conn, objective_id: int) -> int | None:
    row = conn.execute(
        "SELECT route_id FROM ordine_obiective_traseu WHERE objective_id = %s LIMIT 1", (objective_id,)
    ).fetchone()
    return row["route_id"] if row else None


def ensure_route_started(conn, user_id: int, route_id: int) -> None:
    """Create the route progress row if the player has not started the route (the React app never calls start)."""
    conn.execute(
        "INSERT INTO progres_jucatori_trasee (player_id, route_id, status) "
        "VALUES (%s, %s, 'in_progress') ON CONFLICT DO NOTHING",
        (user_id, route_id),
    )


# Mission data for one check. Distance is computed in the database, from the player's position.
# The condition is a fixed SQL fragment; only the values are passed as parameters.
MISSION_TARGET_SQL = """
    SELECT o.objective_id, o.radius_meters, m.mission_id, m.points_reward,
           ST_Distance(o.location,
                       ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS distance_m,
           ARRAY(SELECT rc.accepted_answer FROM raspunsuri_corecte rc
                 WHERE rc.mission_id = m.mission_id) AS accepted_answers
    FROM obiective_turistice o
    JOIN misiuni m ON m.objective_id = o.objective_id
"""


def _fetch_target(conn, latitude: float, longitude: float, condition: str, params: tuple):
    return conn.execute(
        MISSION_TARGET_SQL + f"WHERE {condition} AND o.is_active AND m.is_active",
        (longitude, latitude, *params),
    ).fetchone()


def answer_mission(conn, user_id: int, target: dict, answer: str) -> dict:
    """Check the GPS radius and the answer for one mission. Points are awarded once, in the same transaction."""
    distance = float(target["distance_m"])
    if settings.GPS_CHECK_ENABLED and distance > target["radius_meters"]:
        return _result(
            gps_valid=False,
            message=f"You are {round(distance)} m away. Move closer to the location.",
            total=_total_points(conn, user_id),
        )

    # Create the progress row first: attempts reference it.
    conn.execute(
        "INSERT INTO progres_jucatori_misiuni (player_id, mission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (user_id, target["mission_id"]),
    )
    # Lock the row so two quick submissions cannot award points twice.
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

    accepted = {normalize_answer(text) for text in target["accepted_answers"]}
    is_correct = normalize_answer(answer) in accepted
    conn.execute(
        "INSERT INTO raspunsuri_trimise (player_id, mission_id, answer_text, is_correct) "
        "VALUES (%s, %s, %s, %s)",
        (user_id, target["mission_id"], answer, is_correct),
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


def _validate_location(conn, user_id: int, body: ValidateRequest) -> dict:
    objective_name = LOCATION_OBJECTIVES.get(body.locationId)
    if objective_name is None:
        raise HTTPException(404, "Unknown location")
    target = _fetch_target(conn, body.latitude, body.longitude, "o.name = %s", (objective_name,))
    if target is None:
        raise HTTPException(404, "This location has no active mission")
    route_id = route_of_objective(conn, target["objective_id"])
    if route_id is not None:
        ensure_route_started(conn, user_id, route_id)
    return answer_mission(conn, user_id, target, body.answer)


def _validate_in_adventure(conn, user_id: int, body: AdventureValidateRequest) -> dict:
    route = conn.execute(
        "SELECT is_active FROM trasee_tematice WHERE route_id = %s", (body.adventureId,)
    ).fetchone()
    if route is None or not route["is_active"]:
        raise HTTPException(404, "Adventure not found")

    target = _fetch_target(
        conn,
        body.latitude,
        body.longitude,
        "m.mission_id = %s AND EXISTS (SELECT 1 FROM ordine_obiective_traseu ot "
        "WHERE ot.objective_id = o.objective_id AND ot.route_id = %s)",
        (body.missionId, body.adventureId),
    )
    if target is None:
        raise HTTPException(404, "This mission is not part of this adventure")

    started = conn.execute(
        "SELECT status FROM progres_jucatori_trasee WHERE player_id = %s AND route_id = %s",
        (user_id, body.adventureId),
    ).fetchone()
    if started is None:
        raise HTTPException(409, "Start the adventure first")

    # Progressive unlock: a mission is open only when every earlier mission of the route is completed.
    rows = route_mission_rows(conn, body.adventureId, user_id)
    already_done = any(
        r["mission_id"] == body.missionId and r["progress_status"] == "completed" for r in rows
    )
    if not already_done:
        current = next((r for r in rows if r["progress_status"] != "completed"), None)
        if current is None or current["mission_id"] != body.missionId:
            raise HTTPException(409, "Complete the earlier locations of this adventure first")

    return answer_mission(conn, user_id, target, body.answer)


@router.post("/validare-nivel")
def validate_location(body: ValidateRequest | AdventureValidateRequest, request: Request):
    user_id = require_user_id(request)
    with pool.connection() as conn:
        if isinstance(body, AdventureValidateRequest):
            return _validate_in_adventure(conn, user_id, body)
        return _validate_location(conn, user_id, body)


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


def bot_mission(mission_key: str) -> dict:
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
    data = bot_mission(mission_key)
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
        clues = bot_mission(mission_key)["clues"]
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
    """The result shape the React app and the API contract expect."""
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
