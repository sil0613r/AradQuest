# ARAD QUEST chatbot

A narrator chatbot for the ARAD QUEST city game. Players who are stuck on a mission can ask it for hints or ask questions about the game and Arad. It runs as a separate backend. The game's web page calls it from the mission screen.

The chatbot **never checks answers**. The game does that. If a player types an answer into the chat, the bot sends them to the answer field and does not say whether it is right.

## Folder structure

```
ai_bot/
├── backend/
│   ├── main.py            FastAPI app: /health, /api/bot/start, /api/bot/chat
│   ├── bot.py             chatbot logic: hint ladder, answer leak check
│   ├── prompts.py         the narrator's prompts
│   ├── settings.py        model, limits, texts, allowed origins
│   ├── missions.json      missions, answers and hints (server only)
│   ├── requirements.txt
│   ├── Dockerfile         image used on Railway and in docker/docker-compose.yml
│   └── .env.example       copy to .env and fill in
└── frontend/
    ├── index.html         integration guide and live demo
    ├── chat.js            the chat widget (standalone demo)
    └── chat.css
```

The game's own React site (`frontend/` at the repo root) calls the bot through `VITE_CHATBOT_API_URL`. The files in `ai_bot/frontend/` are a standalone demo and reference.

## How it works

Each player message is classified (hint, question, rules, answer attempt…). Hint requests move one step down the hint ladder, hardest hint first, with no limit. The reply is then written from the unlocked hints only, and the code rejects any reply that contains the answer. The answer is never put in a prompt or sent to the browser.

## Run it locally

Needs Python 3.10+ and an OpenAI API key with credit.

```bash
cd ai_bot/backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
```

Set the values in `ai_bot/backend/.env`:

```
OPENAI_API_KEY=sk-your-key-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080
```

`ALLOWED_ORIGINS` lists the sites that may call the bot (comma-separated, no trailing slash). The `.env.example` values cover the Vite dev server (`5173`) and the Docker site (`8080`).

Start the backend from `ai_bot/backend/` (it listens on `http://localhost:8000`):

```bash
uvicorn main:app --reload
curl http://localhost:8000/health
```

To try the standalone demo page, run this in a second terminal:

```bash
cd ai_bot/frontend
python -m http.server 5500
```

Open `http://localhost:5500`, untick **Mock mode**, and tap **Ajutor**. Add `http://localhost:5500` to `ALLOWED_ORIGINS` for the demo page. Never commit `.env`.

## Run it in Docker

Build and run only the bot:

```bash
docker build -t aradquest-bot ai_bot/backend
docker run --rm -p 8000:8000 --env-file ai_bot/backend/.env aradquest-bot
```

The `.env` file is not copied into the image. It is passed at run time with `--env-file`.

Run the whole project (database, API, bot, and site) with the compose file from the repo root:

```bash
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

Then the bot is on the port set as `BOT_PORT` in `docker/.env` (`8000` by default). See the header of `docker/docker-compose.yml`.

## Deploy on Railway

Deploy this folder as its own service with **Root Directory** set to `ai_bot/backend`. Railway builds the Dockerfile and sets `PORT` for you.

Set these service variables:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | your key |
| `ALLOWED_ORIGINS` | `https://<frontend-domain>` (the public URL of the `web` service) |

Keep one replica. The full step-by-step guide, including the other services, is in [`RAILWAY.md`](../RAILWAY.md) at the repo root.

## Configuration

| Where | What |
|---|---|
| `.env` or Railway variable: `OPENAI_API_KEY` | Your OpenAI key. Required. |
| `.env` or Railway variable: `ALLOWED_ORIGINS` | Comma-separated list of sites allowed to call the bot. If it is not set, the code uses `http://localhost:5500`. |
| `PORT` | Set by Railway. Locally uvicorn uses `8000`. |
| `settings.py` → `MODEL`, `REASONING_EFFORT` | The AI model. Set `REASONING_EFFORT = None` for non-reasoning models. |
| `settings.py` → `GAME_RULES`, `ANSWER_BOX` | What the bot says about the rules and the answer field. **Edit these to match your real game.** |
| `settings.py` → `RATE_LIMIT_PER_MINUTE` | Chat messages per visitor IP address per minute. |
| `prompts.py` → `PERSONA` | The narrator's voice, reply length and rules. |

## Missions and hints

Missions live in `backend/missions.json`. It contains the answers, so keep it on the server and never serve it as a static file.

```json
{
  "primaria": {
    "route": "cultural",
    "title": "Primăria",
    "description": "The text the player sees: location text and the question.",
    "answer": "Ioan",
    "also_block": ["John"],
    "clues": ["hardest hint", "middle hint", "easier hint", "easiest hint"]
  }
}
```

- The key (`primaria`) is the mission ID used by the frontend. `route` is optional and ignored by the bot.
- `answer` and `also_block` are words the bot must never say. Use `also_block` for translations or unusual spelled-out numbers.
- `clues` go from hardest to easiest. Never put the answer or a blocked word in a clue.
- To add a mission, add an entry and restart the server.

## Backend API

| Endpoint | Request | Response |
|---|---|---|
| `GET /health` | none | `{"ok": true}` |
| `POST /api/bot/start` | `{"mission_id": "primaria"}` | `{"session_id": "…", "title": "Primăria"}` |
| `POST /api/bot/chat` | `{"session_id": "…", "message": "…"}` (1 to 500 characters) | `{"reply": "…"}` |

Errors: `404` unknown mission or session (start a new session), `422` invalid message, `429` too many messages, `502` the AI service failed. Replies can take several seconds.

## Frontend integration

The game's React site calls the bot with `VITE_CHATBOT_API_URL` (for example `https://<bot-domain>/api/bot`). That value is set at build time.

For the standalone widget, the reference is:

```html
<link rel="stylesheet" href="chat.css">
<script src="chat.js"></script>
<script>
  AradBot.init({ apiBase: "https://YOUR-BACKEND/api/bot" });
  AradBot.setMission("primaria");   // when a mission screen opens
  AradBot.clearMission();           // when the player leaves it
</script>
```

Never put the OpenAI key, answers or hints in frontend code. The full guide is in `ai_bot/frontend/index.html`.

## Before going live

- Use HTTPS, and set `ALLOWED_ORIGINS` to the real site only (never `*`).
- Run the backend as a single process. Chats are kept in memory and are lost on restart.
- The Dockerfile starts uvicorn with `--proxy-headers` and trusts `X-Forwarded-For` from any sender. That is what makes the per-IP rate limit see real visitors behind Railway's proxy. Do not expose the container directly to the internet without a proxy in front of it.
- Keep `missions.json` and `.env` out of public reach.

## Known limitations

- The leak check only catches the exact words in `answer` and `also_block`, not paraphrases. Treat it as a safety net.
- Invented hints (after your written ones run out) are checked for the answer, but not for accuracy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend fails at startup about the API key | Check that `ai_bot/backend/.env` exists (or `OPENAI_API_KEY` is set) and that you started `uvicorn` from `ai_bot/backend/`. |
| CORS error in the browser | Add the site's origin, with scheme and port, to `ALLOWED_ORIGINS` and restart (or redeploy on Railway). |
| Chat says "Failed to fetch" on the live site | `VITE_CHATBOT_API_URL` on the `web` service must be `https://<bot-domain>/api/bot`. It is a build argument, so redeploy `web` after changing it. |
| `502` from `/api/bot/chat` | Check the backend logs: wrong model name, no credit, or a rejected setting. |
| Error about `reasoning` or the web search tool | Set `REASONING_EFFORT = None` or `USE_WEB_SEARCH = False`. |
| Bot often replies "the mist thickens" | A clue or `also_block` word is too common. Remove it from the clues or from `also_block`. |
| New mission not showing | Restart the backend. Missions load at startup. |
