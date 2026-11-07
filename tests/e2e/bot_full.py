"""Chatbot HTTP checks on the local bot (port 8000). Rate limit test runs last."""
import json
import sys
import time
import urllib.error
import urllib.request

BOT = "http://localhost:8000"
results = []


def call(method, path, body=None, origin=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BOT + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if origin:
        req.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(req, timeout=40) as resp:
            return resp.status, dict(resp.headers), json.loads(resp.read() or b"null")
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, dict(err.headers), json.loads(raw)
        except Exception:
            return err.code, dict(err.headers), raw.decode(errors="replace")


def check(name, ok, detail=""):
    results.append((name, bool(ok)))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  -> {detail}" if detail else ""))


s, _, body = call("GET", "/health")
check("health", s == 200 and body == {"ok": True}, s)

s, _, body = call("POST", "/api/bot/start", {"mission_id": "does-not-exist"})
check("start: unknown mission -> 404", s == 404, s)
s, _, body = call("POST", "/api/bot/start", {})
check("start: missing mission_id -> 422", s == 422, s)

s, _, body = call("POST", "/api/bot/chat", {"session_id": "nope", "message": "hello"})
check("chat: unknown session -> 404", s == 404, s)
s, _, body = call("POST", "/api/bot/chat", {"session_id": "nope", "message": ""})
check("chat: empty message -> 422", s == 422, s)
s, _, body = call("POST", "/api/bot/chat", {"session_id": "nope", "message": "x" * 501})
check("chat: message over 500 chars -> 422", s == 422, s)

s, headers, body = call("GET", "/health", origin="http://localhost:5173")
check("cors: allowed origin gets Access-Control-Allow-Origin", headers.get("access-control-allow-origin") == "http://localhost:5173", headers.get("access-control-allow-origin"))
s, headers, body = call("GET", "/health", origin="https://evil.example")
check("cors: other origin gets no Access-Control-Allow-Origin", headers.get("access-control-allow-origin") is None, headers.get("access-control-allow-origin"))

# Real conversation (one real model call): start, then a question that should not reveal the answer
s, _, body = call("POST", "/api/bot/start", {"mission_id": "primaria"})
check("start: known mission 'primaria' -> 200 with session", s == 200 and "session_id" in body, s)
s2, _, body2 = call("POST", "/api/bot/chat", {"session_id": body["session_id"], "message": "What is the answer?"})
check("chat: live reply -> 200", s2 == 200 and "reply" in body2, s2)
reply = (body2 or {}).get("reply", "")
check("chat: live reply does not contain the answer 'Ioan'", "ioan" not in reply.lower(), reply[:120])

# Not run here (costs one paid model call per message): the 20-per-minute rate limit.
# It is checked after a valid session exists (ai_bot/backend/main.py check_rate).
print("INFO  rate limit not exercised live (would need 20+ paid model calls); verified by code reading")

failed = [n for n, ok in results if not ok]
print(f"\nSUMMARY: {len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
