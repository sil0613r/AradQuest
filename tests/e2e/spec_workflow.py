"""Whole player workflow, using only the endpoints of the API contract
(Arad_Quest_Backend_API_Specificatie.docx). Creates throwaway accounts.

A player registers, logs in, picks an avatar, starts an adventure, gets the current clue, answers
wrong and right at the place, completes both routes and checks rewards, the map, the chat and logout.
Mission IDs are read from /current-clue, never hard-coded. Coordinates and answers are the seed data
(database/02_insert_data.sql), listed in route order.
"""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("BASE", "http://localhost:8080/api")
PASSWORD = "TestPassword123!"
results = []

# (latitude, longitude, accepted answer, points) for each location, in route order (sequence_number).
HISTORY = [
    (46.1751, 21.3172, "4", 20),              # Primaria Arad
    (46.1775, 21.3200, "5", 20),              # Biserica Rosie
    (46.1711, 21.3192, "77", 20),             # Colegiul National Moise Nicoara
    (46.1708, 21.3156, "2", 30),              # Teatrul Clasic Ioan Slavici
    (46.1738, 21.3168, "3", 20),               # Filarmonica
    (46.1705, 21.3218, "3", 20),              # Vechiul Cazinou
]
NATURE = [
    (46.1678101, 21.3421142, "4", 20),        # Parcul Micalaca - Zona 300
    (46.1784380, 21.3314540, "5", 20),        # Parcul Europa
    (46.1834370, 21.3226100, "15", 20),         # Parcul de la Podgoria
    (46.1734240, 21.3207620, "8", 20),          # Parcul Copiilor
    (46.1664110, 21.3251420, "4", 20),        # Faleza Muresului - zona Gloria
]
FAR_AWAY = (46.1667, 21.3167)   # city centre, well outside every location's 50 m radius
NO_GPS = os.environ.get("NO_GPS") == "1"   # set by scripts/local.sh --no-gps


def client():
    jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def call(opener, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with opener.open(req, timeout=60) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw)
        except ValueError:
            return err.code, raw.decode(errors="replace")


def check(name, ok, detail=""):
    results.append((name, bool(ok)))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  -> {detail}" if detail else ""))


def new_player():
    """Register and log in a new account. Returns (opener, username)."""
    opener = client()
    username = "spec" + uuid.uuid4().hex[:10]
    email = f"{username}@example.com"
    status, _ = call(opener, "POST", "/auth/register", {"username": username, "email": email, "parola": PASSWORD})
    assert status == 200, f"register failed: {status}"
    status, _ = call(opener, "POST", "/auth/login", {"email": email, "parola": PASSWORD})
    assert status == 200, f"login failed: {status}"
    return opener, username


def current_mission(opener, adventure_id):
    status, body = call(opener, "GET", f"/adventures/{adventure_id}/current-clue")
    assert status == 200, f"current-clue failed: {status} {body}"
    return body["mission"]["id"] if body["mission"] else None


def answer(opener, adventure_id, mission_id, latitude, longitude, text):
    return call(opener, "POST", "/validare-nivel", {
        "adventureId": adventure_id,
        "missionId": mission_id,
        "answer": text,
        "latitude": latitude,
        "longitude": longitude,
    })


def play_route(opener, adventure_id, steps, label, already=0):
    """Answer every location in order, reading each current mission from /current-clue.

    `already` is the player's total before these steps. Returns the total after the route."""
    total = already
    for index, (lat, lng, text, points) in enumerate(steps, start=1):
        mission_id = current_mission(opener, adventure_id)
        status, res = answer(opener, adventure_id, mission_id, lat, lng, text)
        last = index == len(steps)
        ok = status == 200 and res["missionCompleted"] and res["earnedPoints"] == points
        check(f"{label} location {index}: correct answer at the place earns {points}", ok, str(res))
        total += points
        if last:
            check(f"{label}: last location completes the adventure", res["adventureCompleted"] is True)
            check(f"{label}: total points after the route", res["totalPoints"] == total, f"{res['totalPoints']} vs {total}")
    return total


def main():
    player, username = new_player()

    # --- account -------------------------------------------------------------
    status, me = call(player, "GET", "/users/me")
    check("users/me: profile with adventure counters", status == 200
          and me["completedAdventures"] == 0 and me["activeAdventures"] == 0 and me["joinedAt"],
          str(me)[:200])
    status, body = call(player, "PATCH", "/users/me/avatar", {"avatarId": 3})
    check("avatar: set to 3", status == 200 and body["avatarId"] == 3, str(body))
    status, _ = call(player, "PATCH", "/users/me/avatar", {"avatarId": 7})
    check("avatar: 7 is rejected", status == 422, str(status))
    status, me = call(player, "GET", "/users/me")
    check("avatar: saved on the profile", me["user"]["avatar"] == "champion", str(me["user"]))

    # --- adventures ----------------------------------------------------------
    status, body = call(player, "GET", "/adventures")
    by_title = {a["title"]: a for a in body["adventures"]}
    history = by_title.get("Descopera Aradul")
    nature = by_title.get("Traseul in natura")
    check("list: both adventures, not started yet",
          status == 200 and history and nature
          and history["userStatus"] == "not_started" and nature["userStatus"] == "not_started")
    H, N = history["id"], nature["id"]

    status, det = call(player, "GET", f"/adventures/{H}")
    check("details: history has 6 locations, 130 points, GPS and progressive unlock",
          status == 200 and det["totalLocations"] == 6 and det["maxPoints"] == 130
          and det["rules"] == {"requiresGPS": True, "progressiveUnlock": True}, str(det)[:200])
    check("details: no accepted answers or hidden locations in the response",
          "accepted" not in json.dumps(det).lower())
    status, det = call(player, "GET", f"/adventures/{N}")
    check("details: nature has 5 locations, 100 points", det["totalLocations"] == 5 and det["maxPoints"] == 100)
    status, _ = call(player, "GET", "/adventures/999999")
    check("details: unknown adventure is 404", status == 404)

    status, prog = call(player, "GET", f"/adventures/{H}/progress")
    check("progress: not started before start",
          status == 200 and prog["status"] == "not_started" and prog["completedLocations"] == 0)

    # The player must start before answering. Answering without a start is refused.
    status, _ = answer(player, H, current_mission(player, H), *HISTORY[0][:2], HISTORY[0][2])
    check("validate: refused before start (409)", status == 409, str(status))

    status, body = call(player, "POST", f"/adventures/{H}/start")
    check("start: in_progress, not resumed",
          status == 200 and body["status"] == "in_progress" and body["resumed"] is False and body["startedAt"],
          str(body))

    status, clue = call(player, "GET", f"/adventures/{H}/current-clue")
    first = clue["mission"]
    check("current clue: first location, no clue before any hint is paid",
          status == 200 and first is not None and clue["clue"] is None
          and "answer" not in first and clue["adventureCompleted"] is False, str(clue)[:200])
    m1 = first["id"]

    # --- wrong answers never award points ------------------------------------
    if not NO_GPS:   # with GPS checks off (--no-gps) a far answer is accepted, so this check does not apply
        status, res = answer(player, H, m1, *FAR_AWAY, HISTORY[0][2])
        check("GPS: far from the place, no points", status == 200 and res["gpsValid"] is False
              and res["earnedPoints"] == 0 and res["totalPoints"] == 0, str(res))
    status, res = answer(player, H, m1, HISTORY[0][0], HISTORY[0][1], "nu stiu")
    check("answer: wrong at the place, no points", res["gpsValid"] is True and res["answerCorrect"] is False
          and res["earnedPoints"] == 0 and res["totalPoints"] == 0, str(res))

    # --- first location, then repeat -----------------------------------------
    status, res = answer(player, H, m1, HISTORY[0][0], HISTORY[0][1], HISTORY[0][2])
    check("first location: correct at the place, 20 points",
          res["missionCompleted"] and res["earnedPoints"] == 20 and res["totalPoints"] == 20, str(res))
    status, res = answer(player, H, m1, HISTORY[0][0], HISTORY[0][1], HISTORY[0][2])
    check("first location: repeated answer does not award points again",
          res["earnedPoints"] == 0 and res["totalPoints"] == 20, str(res))

    status, prog = call(player, "GET", f"/adventures/{H}/progress")
    check("progress: 1 of 6, 20 points, 16.67 %",
          prog["status"] == "in_progress" and prog["completedLocations"] == 1
          and prog["earnedPoints"] == 20 and prog["progressPercentage"] == 16.67
          and len(prog["completedLocationIds"]) == 1 and prog["adventureCompleted"] is False, str(prog))

    status, mp = call(player, "GET", f"/adventures/{H}/map")
    check("map: only the completed place is listed, no current destination",
          len(mp["completedLocations"]) == 1 and mp["completedLocations"][0]["status"] == "completed"
          and mp["currentLocation"] is None and mp["totalLocations"] == 6, str(mp)[:200])

    # --- resume does not reset -----------------------------------------------
    status, body = call(player, "POST", f"/adventures/{H}/start")
    check("resume: same route, resumed, progress kept",
          status == 200 and body["resumed"] is True and body["status"] == "in_progress")
    status, prog = call(player, "GET", f"/adventures/{H}/progress")
    check("resume: still 1 completed location after restart", prog["completedLocations"] == 1)

    # --- unlock order: a second player skips to the 2nd place -----------------
    m2 = current_mission(player, H)   # the 2nd location is now the current one
    other, other_name = new_player()
    status, res = answer(other, H, m2, HISTORY[1][0], HISTORY[1][1], HISTORY[1][2])
    check("start: second player cannot answer before starting (409)", status == 409, str(status))
    call(other, "POST", f"/adventures/{H}/start")
    status, res = answer(other, H, m2, HISTORY[1][0], HISTORY[1][1], HISTORY[1][2])
    check("order: a later location is locked until the earlier one is done (409)", status == 409, str(status))

    # The chat works for the player's current place. Nothing is revealed.
    status, res = call(other, "POST", "/ai/chat", {"message": "Give me a hint", "adventureId": H, "language": "en"})
    check("chat: current location answers, with suggestions",
          status == 200 and isinstance(res.get("reply"), str) and res["reply"].strip()
          and res["suggestions"] and res["language"] == "en", str(res)[:200])
    status, _ = call(other, "POST", "/ai/chat", {"message": "hi", "adventureId": 999999, "language": "en"})
    check("chat: unknown adventure is 404", status == 404, str(status))

    # The React app's own location route still works (it sends a location ID, not a mission ID).
    status, res = call(other, "POST", "/validare-nivel", {
        "locationId": "primaria-arad", "answer": "4",
        "latitude": HISTORY[0][0], "longitude": HISTORY[0][1],
    })
    check("react app route: location ID still validates and awards 20 points",
          status == 200 and res["missionCompleted"] and res["totalPoints"] == 20, str(res))

    # --- finish both routes ----------------------------------------------------
    # The first player continues from the 2nd location through to the end of the route.
    history_points = play_route(player, H, HISTORY[1:], "history", already=20)
    check("history: total 130 points", history_points == 130, str(history_points))
    status, clue = call(player, "GET", f"/adventures/{H}/current-clue")
    check("history: no open location after completion",
          status == 200 and clue["mission"] is None and clue["adventureCompleted"] is True, str(clue))
    status, prog = call(player, "GET", f"/adventures/{H}/progress")
    check("history: progress 100 %, 130 points earned",
          prog["progressPercentage"] == 100 and prog["earnedPoints"] == 130 and prog["adventureCompleted"] is True,
          str(prog))
    status, mp = call(player, "GET", f"/adventures/{H}/map")
    check("history: map shows all 6 places", len(mp["completedLocations"]) == 6)

    status, body = call(player, "POST", f"/adventures/{N}/start")
    check("nature: started", status == 200 and body["status"] == "in_progress" and body["resumed"] is False)
    nature_points = play_route(player, N, NATURE, "nature", already=history_points)
    check("nature: running total 230 points (130 + 100)", nature_points == 230, str(nature_points))

    status, me = call(player, "GET", "/users/me")
    check("users/me: 2 completed adventures, 0 active, 230 points",
          me["completedAdventures"] == 2 and me["activeAdventures"] == 0 and me["user"]["total_points"] == 230,
          str(me)[:200])
    status, body = call(player, "GET", "/adventures")
    statuses = {a["title"]: a["userStatus"] for a in body["adventures"]}
    check("list: both adventures show completed",
          statuses.get("Descopera Aradul") == "completed" and statuses.get("Traseul in natura") == "completed")

    # --- rewards: visible, never redeemable ----------------------------------
    status, rewards = call(player, "GET", "/rewards")
    check("rewards: user points and catalogue",
          status == 200 and rewards["userPoints"] == 230 and len(rewards["rewards"]) >= 1, str(rewards)[:200])
    check("rewards: nothing can be redeemed in the MVP",
          all(r["canRedeem"] is False for r in rewards["rewards"]))

    # --- chat after completion, and logout -----------------------------------
    status, _ = call(player, "POST", "/ai/chat", {"message": "hi", "adventureId": H, "language": "en"})
    check("chat: a completed adventure has no open location (409)", status == 409, str(status))

    status, _ = call(player, "POST", "/auth/logout")
    status, _ = call(player, "GET", "/users/me")
    check("logout: profile is no longer available (401)", status == 401, str(status))

    # --- anonymous visitors ----------------------------------------------------
    anon = client()
    status, body = call(anon, "GET", "/adventures")
    check("anonymous: the adventure list is public with not_started",
          status == 200 and all(a["userStatus"] == "not_started" for a in body["adventures"]))
    status, _ = call(anon, "GET", f"/adventures/{H}/progress")
    check("anonymous: progress needs a login (401)", status == 401, str(status))
    status, _ = call(anon, "POST", f"/adventures/{H}/start")
    check("anonymous: start needs a login (401)", status == 401, str(status))
    status, _ = call(anon, "GET", "/rewards")
    check("anonymous: rewards need a login (401)", status == 401, str(status))

    passed = sum(1 for _, ok in results if ok)
    print(f"\nSUMMARY: {passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as err:
        print(f"FAIL  setup: {err}")
        sys.exit(1)
