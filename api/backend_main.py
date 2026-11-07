import math
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, Response, Request
from pydantic import BaseModel

load_dotenv(Path(__file__).parent / "secrets.env")   # DATABASE_URL


DB_CONFIG = {
    # The Railway database. The URL (with its password) is set in api/secrets.env, never in this file.
    "dsn": os.getenv("DATABASE_URL", ""),
}

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # La hackathon permitem conexiuni de oriunde
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- FUNCȚII UTILITARE ---

def calc_distanta(lat1, lon1, lat2, lon2):
    # formula haversine
    r = 6371000  # raza pamantului in metri
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)  # dif pe verticala
    delta_lambda = math.radians(lon2 - lon1)  # dif pe orizontala

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return r * c


def extrage_date_obiectiv(adventure_id: int, mission_id: int):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = """
            SELECT 
                ST_Y(o.location::geometry) as lat,
                ST_X(o.location::geometry) as lng,
                rc.accepted_answer,
                o.name,
                m.points_reward
            FROM obiective_turistice o
            JOIN misiuni m ON o.objective_id = m.objective_id
            JOIN raspunsuri_corecte rc ON m.mission_id = rc.mission_id
            JOIN ordine_obiective_traseu ot ON o.objective_id = ot.objective_id
            WHERE ot.route_id = %s AND m.mission_id = %s;
        """
        cursor.execute(query, (adventure_id, mission_id))
        rez = cursor.fetchone()
        cursor.close()

        if rez:
            return {
                "lat": rez[0],
                "lng": rez[1],
                "raspuns_corect": rez[2],
                "nume": rez[3],
                "puncte": rez[4] if rez[4] else 20
            }
        return None
    except Exception as e:
        print(f"Eroare DB: {e}")
        return None
    finally:
        if conn is not None:
            conn.close()


# --- MODELE PYDANTIC ---

class DateValidare(BaseModel):
    adventureId: int
    missionId: int
    answer: str
    latitude: float
    longitude: float


class DateLogin(BaseModel):
    email: str
    password: str


class DateRegister(BaseModel):
    username: str
    email: str
    password: str


# --- RUTE AUTENTIFICARE ---

@app.post("/auth/register")
def register_jucator(date: DateRegister):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        check_query = "SELECT player_id FROM jucatori WHERE email = %s OR username = %s;"
        cursor.execute(check_query, (date.email, date.username))
        exista = cursor.fetchone()

        if exista:
            return {"status": "eroare", "mesaj": "Email-ul sau numele de utilizator există deja."}

        insert_query = """
            INSERT INTO jucatori (username, email, password_hash, total_points, avatar_id) 
            VALUES (%s, %s, %s, 0, 1) RETURNING player_id;
        """
        cursor.execute(insert_query, (date.username, date.email, date.password))
        new_user_id = cursor.fetchone()[0]

        conn.commit()
        cursor.close()

        return {"status": "succes", "mesaj": "Cont creat", "user_id": new_user_id}

    except Exception as e:
        print(f"Eroare la baza de date (register): {e}")
        if conn is not None:
            conn.rollback()
        return {"status": "eroare", "mesaj": "Eroare interna a serverului."}

    finally:
        if conn is not None:
            conn.close()


@app.post("/auth/login")
def login_jucator(date: DateLogin, response: Response):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = "SELECT player_id, username, password_hash FROM jucatori WHERE email=%s;"
        cursor.execute(query, (date.email,))
        jucator = cursor.fetchone()

        cursor.close()

        if not jucator:
            return {"status": "eroare", "mesaj": "Adresa de email nu a fost gasita."}

        player_id = jucator[0]
        username = jucator[1]
        password_hash = jucator[2]

        if date.password != password_hash:
            return {"status": "eroare", "mesaj": "Parola incorecta."}

        response.set_cookie(
            key="session_token",
            value=f"user_{player_id}",
            httponly=True,
            samesite="lax"
        )

        return {
            "status": "succes",
            "user_id": player_id,
            "username": username,
            "mesaj": "Autentificare reusita"
        }
    except Exception as e:
        print(f"Eroare la baza de date (login): {e}")
        return {"status": "eroare", "mesaj": "Eroare interna a serverului."}

    finally:
        if conn is not None:
            conn.close()


@app.post("/auth/logout")
def logout_jucator(response: Response):
    response.delete_cookie(key="session_token")
    return {"status": "succes", "mesaj": "Succesfully logged out."}


# --- RUTE JOC ---

@app.get("/api/users/me")
def get_user_profile(request: Request):
    session_token = request.cookies.get("session_token")

    if not session_token or not session_token.startswith("user_"):
        return {"error": {"code": "UNAUTHORIZED", "message": "Nu esti autentificat. Te rugam sa faci login."}}

    try:
        player_id = int(session_token.split("_")[1])
    except:
        return {"error": {"code": "UNAUTHORIZED", "message": "Token invalid."}}

    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = """
            SELECT player_id, username, email, avatar_id, total_points, created_at 
            FROM jucatori 
            WHERE player_id = %s;
        """
        cursor.execute(query, (player_id,))
        user = cursor.fetchone()

        if not user:
            return {"error": {"code": "NOT_FOUND", "message": "Utilizatorul nu a fost gasit in baza de date."}}

        # Adventure counts come from progres_jucatori_trasee, not from fixed numbers.
        cursor.execute(
            "SELECT COUNT(*) FILTER (WHERE status = 'completed'), "
            "COUNT(*) FILTER (WHERE status = 'in_progress') "
            "FROM progres_jucatori_trasee WHERE player_id = %s;",
            (player_id,),
        )
        completed_adventures, active_adventures = cursor.fetchone()

        return {
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "avatarId": user[3] if user[3] else 1,
            "totalPoints": user[4] if user[4] else 0,
            "completedAdventures": completed_adventures,
            "activeAdventures": active_adventures,
            "joinedAt": user[5].isoformat() + "Z" if user[5] else None   # the database value, never a fixed date
        }

    except Exception as e:
        print(f"Eroare la /api/users/me: {e}")
        return {"error": {"code": "SERVER_ERROR", "message": "Eroare interna a serverului."}}
    finally:
        if conn is not None:
            cursor.close()
            conn.close()


@app.get("/api/adventures")
def get_adventures():
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = """
            SELECT 
                t.route_id, 
                t.title, 
                t.description,
                COUNT(ot.objective_id) as total_locations
            FROM trasee_tematice t
            LEFT JOIN ordine_obiective_traseu ot ON t.route_id = ot.route_id
            GROUP BY t.route_id, t.title, t.description
            ORDER BY t.route_id;
        """
        cursor.execute(query)
        trasee_db = cursor.fetchall()

        lista_aventuri = []
        for rand in trasee_db:
            route_id = rand[0]
            title = rand[1] if rand[1] else "Titlu indisponibil"
            description = rand[2] if rand[2] else "Descriere indisponibila"
            total_locs = rand[3]

            is_history = "istor" in title.lower() or "histor" in title.lower()
            is_nature = "natur" in title.lower()

            lista_aventuri.append({
                "id": route_id,
                "title": title,
                "category": "History" if is_history else "Nature" if is_nature else "General",
                "description": description,
                "imageUrl": None,
                "icon": "🏛️" if is_history else "🌿" if is_nature else "📍",
                "totalLocations": total_locs,
                "totalPoints": 130 if is_history else 750 if is_nature else 100,
                "estimatedDuration": "2-3 hours" if is_history else None,
                "status": "not_started"
            })

        return {"adventures": lista_aventuri}

    except Exception as e:
        print(f"Eroare la baza de date (GET adventures): {e}")
        return {"error": {"code": "SERVER_ERROR", "message": "Eroare interna a serverului."}}
    finally:
        if conn is not None:
            conn.close()


@app.get("/api/adventures/{adventure_id}")
def get_adventure_details(adventure_id: int):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query_traseu = """
            SELECT route_id, title, description, estimated_minutes 
            FROM trasee_tematice 
            WHERE route_id = %s;
        """
        cursor.execute(query_traseu, (adventure_id,))
        traseu = cursor.fetchone()

        if not traseu:
            return {"error": {"code": "NOT_FOUND", "message": "Traseul nu exista."}}

        cursor.execute("SELECT COUNT(*) FROM ordine_obiective_traseu WHERE route_id = %s", (adventure_id,))
        total_locations = cursor.fetchone()[0]

        return {
            "id": traseu[0],
            "title": traseu[1],
            "description": traseu[2],
            "difficulty": "easy",
            "estimatedMinutes": traseu[3] if traseu[3] else 60,
            "totalLocations": total_locations,
            "maxPoints": 130,
            "rules": {
                "requiresGPS": True,
                "progressiveUnlock": True
            }
        }

    except Exception as e:
        print(f"Eroare la /api/adventures/{adventure_id}: {e}")
        return {"error": {"code": "SERVER_ERROR", "message": "Eroare interna a serverului."}}
    finally:
        if conn is not None:
            cursor.close()
            conn.close()


@app.post("/api/validare-nivel")
def validare_nivel(date: DateValidare, request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token or not session_token.startswith("user_"):
        return {"error": {"code": "UNAUTHORIZED", "message": "Nu esti autentificat."}}

    obiectiv = extrage_date_obiectiv(date.adventureId, date.missionId)
    if not obiectiv:
        return {"error": {"code": "NOT_FOUND", "message": "Traseu sau misiune invalida."}}

    latitudine_corecta = obiectiv["lat"]
    longitudine_corecta = obiectiv["lng"]
    raspuns_corect = str(obiectiv["raspuns_corect"]).strip().lower()
    puncte_misiune = obiectiv["puncte"]

    distanta = calc_distanta(date.latitude, date.longitude, latitudine_corecta, longitudine_corecta)
    if distanta > 50:
        return {
            "success": False,
            "answerCorrect": False,
            "gpsValid": False,
            "missionCompleted": False,
            "earnedPoints": 0,
            "totalPoints": 0,
            "adventureCompleted": False,
            "message": f"Esti prea departe! Mai ai {int(distanta)} metri."
        }

    if date.answer.strip().lower() != raspuns_corect:
        return {
            "success": False,
            "answerCorrect": False,
            "gpsValid": True,
            "missionCompleted": False,
            "earnedPoints": 0,
            "totalPoints": 0,
            "adventureCompleted": False,
            "message": "Esti in locul potrivit, dar indiciul e gresit."
        }

    return {
        "success": True,
        "answerCorrect": True,
        "gpsValid": True,
        "missionCompleted": True,
        "earnedPoints": puncte_misiune,
        "totalPoints": puncte_misiune,
        "adventureCompleted": False,
        "message": "Corect! Ai deblocat urmatoarea locatie."
    }