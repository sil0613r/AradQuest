"""Full API test through nginx (same path the browser uses). Creates throwaway accounts."""
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

BASE = os.environ.get("BASE", "http://localhost:8080/api")
NO_GPS = os.environ.get("NO_GPS") == "1"   # set by scripts/local.sh --no-gps
results = []


def client():
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    return opener


def call(opener, method, path, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
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


uid = uuid.uuid4().hex[:8]
A_EMAIL = f"api.a.{uid}@example.com"
B_EMAIL = f"api.b.{uid}@example.com"
A_USER = f"apia{uid}"
B_USER = f"apib{uid}"
PW = "correct-horse-1"

a = client()
b = client()

# ---- Registration validation
s, _ = call(a, "POST", "/auth/register", {"username": "xy", "email": A_EMAIL, "parola": PW})
check("register: username too short -> 422", s == 422, s)
s, _ = call(a, "POST", "/auth/register", {"username": A_USER, "email": "not-an-email", "parola": PW})
check("register: bad email -> 422", s == 422, s)
s, _ = call(a, "POST", "/auth/register", {"username": A_USER, "email": A_EMAIL, "parola": "short"})
check("register: password under 8 chars -> 422", s == 422, s)
s, _ = call(a, "POST", "/auth/register", {"username": A_USER, "email": A_EMAIL})
check("register: missing password -> 422", s == 422, s)
s, body = call(a, "POST", "/auth/register", {"username": A_USER, "email": A_EMAIL, "parola": PW})
check("register: valid -> 200 succes", s == 200 and body.get("status") == "succes", s)
s, body = call(a, "POST", "/auth/register", {"username": f"other{uid}", "email": A_EMAIL, "parola": PW})
check("register: duplicate email -> 409", s == 409, s)
s, body = call(b, "POST", "/auth/register", {"username": B_USER, "email": B_EMAIL, "parola": PW})
check("register: second account -> 200", s == 200, s)

# ---- Login and session
s, body = call(a, "GET", "/users/me")
check("users/me without session -> 401", s == 401, s)
s, body = call(a, "POST", "/auth/login", {"email": A_EMAIL, "parola": "wrong-password-9"})
check("login: wrong password -> 401", s == 401, s)
s, body = call(a, "POST", "/auth/login", {"email": A_EMAIL.upper(), "parola": PW})
check("login: email is case-insensitive -> 200", s == 200 and body["user"]["username"] == A_USER, s)
check("login: default avatar is explorer", body["user"]["avatar"] == "explorer", body["user"].get("avatar"))
check("login: no password hash in response", "password_hash" not in json.dumps(body))
s, body = call(a, "GET", "/users/me")
check("users/me with session -> 200", s == 200 and body["user"]["username"] == A_USER, s)
call(b, "POST", "/auth/login", {"email": B_EMAIL, "parola": PW})

# ---- Profile
s, body = call(a, "PATCH", "/users/me", {"avatar": "wizard"})
check("profile: unknown avatar -> 422", s == 422, s)
s, body = call(a, "PATCH", "/users/me", {"username": "  ab  "})
check("profile: username too short after trim -> 422", s == 422, s)
s, body = call(a, "PATCH", "/users/me", {"username": B_USER})
check("profile: taken username -> 409", s == 409, s)
s, body = call(a, "PATCH", "/users/me", {"email": B_EMAIL})
check("profile: taken email -> 409", s == 409, s)
s, body = call(a, "PATCH", "/users/me", {"avatar": "champion"})
check("profile: avatar saved -> champion", s == 200 and body["user"]["avatar"] == "champion", s)
s, body = call(a, "GET", "/users/me")
check("profile: avatar persists on reload", body["user"]["avatar"] == "champion", body["user"].get("avatar"))

# ---- Settings
s, body = call(a, "GET", "/users/me/settings")
check("settings: defaults when none saved", s == 200 and body["settings"]["announcements"] is False, body)
s, body = call(a, "PUT", "/users/me/settings", {"adventureUpdates": "maybe", "rewards": True, "announcements": True})
check("settings: wrong type -> 422", s == 422, s)
s, body = call(a, "PUT", "/users/me/settings", {"adventureUpdates": False, "rewards": True, "announcements": True})
check("settings: save -> 200", s == 200, s)
s, body = call(a, "GET", "/users/me/settings")
check("settings: saved values come back", body["settings"] == {"adventureUpdates": False, "rewards": True, "announcements": True}, body)
s, body = call(b, "GET", "/users/me/settings")
check("settings: other player does not see them", body["settings"]["adventureUpdates"] is True, body)

# ---- Game: auth and validation
s, _ = call(client(), "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "4", "latitude": 46.1751, "longitude": 21.3172})
check("answer check: no session -> 401", s == 401, s)
s, _ = call(a, "POST", "/validare-nivel", {"locationId": "nowhere", "answer": "x", "latitude": 46.1751, "longitude": 21.3172})
check("answer check: unknown location -> 404", s == 404, s)
s, _ = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "", "latitude": 46.1751, "longitude": 21.3172})
check("answer check: empty answer -> 422", s == 422, s)
s, _ = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "x" * 501, "latitude": 46.1751, "longitude": 21.3172})
check("answer check: answer over 500 chars -> 422", s == 422, s)
s, _ = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "4", "latitude": 95, "longitude": 21.3172})
check("answer check: latitude out of range -> 422", s == 422, s)
# ---- Game: real rules on the history route (Primaria Arad, answer "4")
PRIMARIA = {"latitude": 46.1751, "longitude": 21.3172}
s, body = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "4", **PRIMARIA})
check("answer check: right place + right answer", s == 200 and body["missionCompleted"] and body["earnedPoints"] == 20, body)
s, body = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "4", **PRIMARIA})
check("answer check: second time -> already completed, 0 points", s == 200 and body["earnedPoints"] == 0 and body["message"].startswith("You already"), body)
s, body = call(a, "POST", "/validare-nivel", {"locationId": "teatrul-ioan-slavici", "answer": "wrong", "latitude": 46.1708, "longitude": 21.3156})
check("answer check: right place, wrong answer -> not completed", s == 200 and not body["missionCompleted"] and body["answerCorrect"] is False, body)
s, body = call(a, "POST", "/validare-nivel", {"locationId": "teatrul-ioan-slavici", "answer": "wrong", "latitude": 46.1708, "longitude": 21.3156})
check("answer check: wrong answer keeps earlier total", body["totalPoints"] == 20, body)
if not NO_GPS:   # with GPS checks off (--no-gps) a far answer is accepted, so this check does not apply
    s, body = call(a, "POST", "/validare-nivel", {"locationId": "teatrul-ioan-slavici", "answer": "2", "latitude": 44.4268, "longitude": 26.1025})
    check("answer check: far away -> gpsValid false, nothing saved", s == 200 and body["gpsValid"] is False and body["missionCompleted"] is False, body)
s, body = call(a, "POST", "/validare-nivel", {"locationId": "primaria-arad", "answer": "  4  ", **PRIMARIA})
check("answer check: normalized repeat is still 'already completed'", body["earnedPoints"] == 0, body)

s, body = call(a, "GET", "/progress")
check("progress: lists completed history location", s == 200 and body["completedLocations"] == ["primaria-arad"] and body["totalPoints"] == 20, body)
s, body = call(b, "GET", "/progress")
check("progress: other player has none", body["completedLocations"] == [] and body["totalPoints"] == 0, body)

s, body = call(a, "POST", "/progress/reset", {"adventureId": "history"})
check("reset route is gone (no way to clear progress)", s in (404, 405), s)
s, body = call(a, "GET", "/progress")
check("progress is kept after the attempted reset", body["completedLocations"] == ["primaria-arad"] and body["totalPoints"] == 20, body)

# ---- Logout
s, _ = call(a, "POST", "/auth/logout")
check("logout -> 200", s == 200, s)
s, _ = call(a, "GET", "/users/me")
check("after logout users/me -> 401", s == 401, s)
s, _ = call(a, "GET", "/progress")
check("after logout progress -> 401", s == 401, s)

# ---- Health through the proxy
s, body = call(client(), "GET", "/health/db")
check("db health through proxy -> 200", s == 200, s)

failed = [n for n, ok in results if not ok]
print(f"\nSUMMARY: {len(results) - len(failed)}/{len(results)} checks passed")
if failed:
    print("FAILED:", *failed, sep="\n  ")
sys.exit(1 if failed else 0)
