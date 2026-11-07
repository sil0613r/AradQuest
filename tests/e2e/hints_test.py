"""Hint feature through nginx (same path the browser uses). Throwaway accounts."""
import http.cookiejar
import json
import os
import sys
import threading
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("BASE", "http://localhost:8080/api")
BOT = os.environ.get("BOT", "http://localhost:8000")
# The shared token lives in the bot's local env file (gitignored). Same value as BOT_INTERNAL_TOKEN in api/secrets.env.
BOT_ENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ai_bot", "backend", ".env")
TOKEN = open(BOT_ENV).read().split("INTERNAL_TOKEN=")[1].split()[0]
results = []


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(opener, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with opener.open(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw)
        except Exception:
            return err.code, raw.decode(errors="replace")


def check(name, ok, detail=""):
    results.append((name, bool(ok)))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  -> {detail}" if detail else ""))


def bot_clues(key):
    req = urllib.request.Request(f"{BOT}/internal/missions/{key}", headers={"X-Internal-Token": TOKEN})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())["clues"]


uid = uuid.uuid4().hex[:8]
a = client()
s, _ = call(a, "POST", "/auth/register", {"username": f"hint{uid}", "email": f"hint.{uid}@example.com", "parola": "correct-horse-1"})
check("setup: account created", s == 200, s)
s, _ = call(a, "POST", "/auth/login", {"email": f"hint.{uid}@example.com", "parola": "correct-horse-1"})
check("setup: logged in", s == 200, s)

# Auth and unknown location
s, _ = call(client(), "GET", "/locations/primaria-arad/mission")
check("mission: no session -> 401", s == 401, s)
s, _ = call(client(), "POST", "/hints/next", {"locationId": "primaria-arad"})
check("hint: no session -> 401", s == 401, s)
s, _ = call(a, "GET", "/locations/nowhere/mission")
check("mission: unknown location -> 404", s == 404, s)
s, _ = call(a, "POST", "/hints/next", {"locationId": "nowhere"})
check("hint: unknown location -> 404", s == 404, s)

# Mission text: from the chatbot service, no hints yet
s, m = call(a, "GET", "/locations/biserica-rosie/mission")
clues = bot_clues("biserica_rosie")
check("mission: text comes back with clue count", s == 200 and m["title"] and m["description"] and m["clueCount"] == len(clues), f"clueCount={m.get('clueCount') if m else None}")
check("mission: no hints revealed before paying", m["hintsUsed"] == 0 and m["hints"] == [], m)
check("mission: hint cost is 10", m["hintCost"] == 10, m["hintCost"])

# No points yet
s, body = call(a, "POST", "/hints/next", {"locationId": "biserica-rosie"})
check("hint: refused with 0 points (409)", s == 409 and "points" in body["detail"], f"{s} {body}")

# Earn 20 points by solving Primaria (answer 4, correct place)
s, body = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "4", "latitude": 46.1751, "longitude": 21.3172})
check("setup: solved primaria, 20 points", body["totalPoints"] == 20, body.get("totalPoints"))

# Open two hints in list order, 10 points each
s, h1 = call(a, "POST", "/hints/next", {"locationId": "biserica-rosie"})
check("hint 1 opens, costs 10", s == 200 and h1["totalPoints"] == 10 and h1["hintsUsed"] == 1, f"{s} {h1}")
check("hint 1 is the first clue in missions.json", h1["hint"] == clues[0], h1.get("hint", "")[:60])
s, h2 = call(a, "POST", "/hints/next", {"locationId": "biserica-rosie"})
check("hint 2 opens, total 0", s == 200 and h2["totalPoints"] == 0 and h2["hint"] == clues[1], f"{s} {h2}")
s, body = call(a, "POST", "/hints/next", {"locationId": "biserica-rosie"})
check("hint with 0 points refused (409)", s == 409, f"{s} {body}")

# Saved and shown again after reload, without charging again
s, m = call(a, "GET", "/locations/biserica-rosie/mission")
check("mission: paid hints are returned after reload", m["hintsUsed"] == 2 and m["hints"] == clues[:2], f"hintsUsed={m['hintsUsed']}")
s, me = call(a, "GET", "/progress")
check("points: still 0 after reload (no double charge)", me["totalPoints"] == 0, me["totalPoints"])

# Solved location: no more hints
s, body = call(a, "POST", "/hints/next", {"locationId": "primaria-arad"})
check("hint on a solved location refused (409)", s == 409, f"{s} {body}")

# Race: exactly 10 points, two requests at the same time for a different location.
s, _ = call(a, "POST", "/validare-nivel", {"locationId": "teatrul-ioan-slavici", "answer": "wrong", "latitude": 46.1708, "longitude": 21.3156})
# Give the account 10 points with a correct answer at Teatrul (30 points is its reward, so use Biserica's 20 + nothing)
# Simplest: solve Teatrul correctly (30 points), then it has 30; use 2 hints elsewhere is not needed.
s, body = call(a, "POST", "/validare-nivel", {"locationId": "teatrul-ioan-slavici", "answer": "2", "latitude": 46.1708, "longitude": 21.3156})
check("setup: solved teatrul (+30)", body["totalPoints"] == 30, body.get("totalPoints"))
results_race = []


def worker():
    results_race.append(call(a, "POST", "/hints/next", {"locationId": "vechiul-cazino"}))


# 30 points now. Two hints on Vechiul Cazinou leave exactly 10.
call(a, "POST", "/hints/next", {"locationId": "vechiul-cazino"})
call(a, "POST", "/hints/next", {"locationId": "vechiul-cazino"})
s, me = call(a, "GET", "/progress")
check("race setup: exactly 10 points left", me["totalPoints"] == 10, me["totalPoints"])
threads = [threading.Thread(target=worker) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()
statuses = sorted(r[0] for r in results_race)
check("race: one hint succeeds, one is refused", statuses == [200, 409], str(statuses))
s, me = call(a, "GET", "/progress")
check("race: never below zero, charged once", me["totalPoints"] == 0, me["totalPoints"])

# Progress cannot be reset anymore: the endpoint is gone and the paid hints stay recorded.
s, _ = call(a, "POST", "/progress/reset", {"adventureId": "history"})
check("reset route is gone", s in (404, 405), s)
s, m = call(a, "GET", "/locations/biserica-rosie/mission")
check("paid hints are kept (no reset)", m["hintsUsed"] == 2, m["hintsUsed"])

failed = [n for n, ok in results if not ok]
print(f"\nSUMMARY: {len(results) - len(failed)}/{len(results)} checks passed")
if failed:
    print("FAILED:", *failed, sep="\n  ")
sys.exit(1 if failed else 0)
