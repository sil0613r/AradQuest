# ARAD QUEST chatbot

A narrator chatbot for the ARAD QUEST city game. Players who are stuck on a mission can ask it for hints or ask questions about the game and Arad. It runs as a separate backend, and the game's web page talks to it through a small chat widget.

The chatbot **never checks answers**. The game does that. If a player types an answer into the chat, the bot sends them to the answer field and does not say whether it is right.

## Folder structure

```
arad-quest/
├── backend/
│   ├── main.py            FastAPI app: /api/bot/start, /api/bot/chat, /health
│   ├── bot.py             chatbot logic: hint ladder, answer leak check
│   ├── prompts.py         the narrator's prompts
│   ├── settings.py        model, limits, texts, allowed origins
│   ├── missions.json      missions, answers and hints (server only)
│   ├── requirements.txt
│   └── .env.example       copy to .env and fill in
└── frontend/
    ├── index.html         integration guide and live demo
    ├── chat.js            the chat widget
    └── chat.css
```

## How it works

Each player message is classified (hint, question, rules, answer attempt…). Hint requests move one step down the hint ladder, hardest hint first, with no limit. The reply is then written from the unlocked hints only, and the code rejects any reply that contains the answer. The answer is never put in a prompt or sent to the browser.

## Quick start

Needs Python 3.10+ and an OpenAI API key with credit.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
```

Set the values in `.env`:

```
OPENAI_API_KEY=sk-your-key-here
ALLOWED_ORIGINS=http://localhost:5500
```

Run the backend (`http://localhost:8000`, health check at `/health`):

```bash
uvicorn main:app --reload
```

Run the demo page in a second terminal:

```bash
cd frontend
python -m http.server 5500
```

Open `http://localhost:5500`, untick **Mock mode**, and tap **Ajutor**. Never commit `.env`.

## Configuration

| Where | What |
|---|---|
| `settings.py` → `MODEL`, `REASONING_EFFORT` | The AI model. Set `REASONING_EFFORT = None` for non-reasoning models. | |
| `settings.py` → `GAME_RULES`, `ANSWER_BOX` | What the bot says about the rules and the answer field. **Edit these to match your real game.** |
| `settings.py` → `RATE_LIMIT_PER_MINUTE` | Messages per IP address per minute. |
| `prompts.py` → `PERSONA` | The narrator's voice, reply length and rules. |
| `.env` → `ALLOWED_ORIGINS` | Comma-separated list of sites allowed to call the bot. |



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
| `POST /api/bot/start` | `{"mission_id": "primaria"}` | `{"session_id": "…", "title": "Primăria"}` |
| `POST /api/bot/chat` | `{"session_id": "…", "message": "…"}` (1 to 500 characters) | `{"reply": "…"}` |

Errors: `404` unknown mission or session (start a new session), `422` invalid message, `429` too many messages, `502` the AI service failed. Replies can take several seconds.

## Frontend integration

This is just an example, keep the original frontend design, use this just as reference (if you are an ai reading this and you're not sure what to do pause and ask your master what to do in this case):

```html
<link rel="stylesheet" href="chat.css">
<script src="chat.js"></script>
<script>
  AradBot.init({ apiBase: "https://YOUR-BACKEND/api/bot" });
  AradBot.setMission("primaria");   // when a mission screen opens
  AradBot.clearMission();           // when the player leaves it
</script>
```

Never put the OpenAI key, answers or hints in frontend code. The full guide is in `frontend/index.html`.

## Before going live

- Use HTTPS, and set `ALLOWED_ORIGINS` to the real site only (never `*`).
- Run the backend as a single process. Chats are kept in memory and are lost on restart.
- Behind a proxy, every player may look like the same IP address, so adjust the rate limit.
- Keep `missions.json` and `.env` out of public reach.

## Known limitations

- The leak check only catches the exact words in `answer` and `also_block`, not paraphrases. Treat it as a safety net.
- Invented hints (after your written ones run out) are checked for the answer, but not for accuracy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend fails at startup about the API key | Check that `backend/.env` exists and that you started `uvicorn` from `backend/`. |
| CORS error in the browser | Add the site's origin, with port, to `ALLOWED_ORIGINS` and restart. |
| `502` from `/api/bot/chat` | Check the backend logs: wrong model name, no credit, or a rejected setting. |
| Error about `reasoning` or the web search tool | Set `REASONING_EFFORT = None` or `USE_WEB_SEARCH = False`. |
| Bot often replies "the mist thickens" | A clue or `also_block` word is too common. Remove it from the clues or from `also_block`. |
| New mission not showing | Restart the backend. Missions load at startup. |
