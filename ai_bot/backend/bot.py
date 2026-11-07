"""Chatbot logic: hint ladder, two-step turn, answer leak check. No web code in here."""
import json
import re
import unicodedata
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, Field, PrivateAttr

import settings
from prompts import (
    ANSWER_ATTEMPT_INSTRUCTIONS, ANSWER_REQUEST_INSTRUCTIONS, CLASSIFIER_PROMPT,
    EXTRA_HINT_PROMPT, HINT_INSTRUCTIONS, NO_MORE_HINTS, PERSONA,
)

client = OpenAI()   # reads OPENAI_API_KEY from the environment


class Mission(BaseModel):
    """Everything the model may see. The answer is NOT stored here."""
    title: str
    description: str
    clues: list[str]   # hardest first


class Intent(BaseModel):
    intent: Literal["hint", "question", "rules", "answer_request", "answer_attempt", "out_of_scope"]


class GeneratedHint(BaseModel):
    text: str


def load_missions() -> dict[str, tuple[Mission, list[str]]]:
    """{mission_id: (Mission, blocked_terms)}. blocked_terms = the answer plus extra words never to say."""
    raw = json.loads(settings.MISSIONS_FILE.read_text(encoding="utf-8"))
    missions = {}
    for mission_id, m in raw.items():
        mission = Mission(title=m["title"], description=m["description"], clues=m["clues"])
        missions[mission_id] = (mission, [m["answer"], *m.get("also_block", [])])
    return missions


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", text).strip()


class GameSession(BaseModel):
    mission: Mission
    next_index: int = 0
    extra_clues: list[str] = Field(default_factory=list)
    history: list[dict] = Field(default_factory=list)
    _blocked: list[str] = PrivateAttr(default_factory=list)   # never sent to the model or dumped

    def __init__(self, mission: Mission, blocked: list[str], **data):
        super().__init__(mission=mission, **data)
        self._blocked = blocked

    def ladder(self) -> list[str]:
        return self.mission.clues + self.extra_clues

    def revealed(self) -> list[str]:
        return self.ladder()[: self.next_index]

    def leaks(self, text: str) -> bool:
        t = normalize(text)
        for term in self._blocked:
            term = normalize(term)
            if term and re.search(rf"(?<!\w){re.escape(term)}(?!\w)", t):
                return True
        return False


def _args() -> dict:
    args = {"model": settings.MODEL}
    if settings.REASONING_EFFORT:
        args["reasoning"] = {"effort": settings.REASONING_EFFORT}
    return args


def classify(session: GameSession, message: str) -> str:
    """Step 1: what does the player want? Sees the mission text, NOT the hints."""
    recent = "\n".join(f"{m['role']}: {m['content']}" for m in session.history[-4:]) or "(none)"
    resp = client.responses.parse(
        input=[
            {"role": "system", "content": CLASSIFIER_PROMPT},
            {"role": "user", "content": (
                f"Mission: {session.mission.title}\n{session.mission.description}\n\n"
                f"Recent chat:\n{recent}\n\nPlayer message: {message}"
            )},
        ],
        text_format=Intent,
        **_args(),
    )
    return resp.output_parsed.intent


def generate_extra_hint(session: GameSession) -> str | None:
    """Used only when the written hints have run out. Checked for leaks."""
    given = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(session.ladder()))
    user_text = f"Mission: {session.mission.title}\n{session.mission.description}\n\nHints so far:\n{given or '(none)'}"
    for _ in range(settings.MAX_RETRIES):
        resp = client.responses.parse(
            input=[{"role": "system", "content": EXTRA_HINT_PROMPT}, {"role": "user", "content": user_text}],
            text_format=GeneratedHint,
            **_args(),
        )
        text = resp.output_parsed.text.strip()
        if text and not session.leaks(text):
            return text
    return None


def next_hint(session: GameSession) -> str | None:
    """One step down the ladder; None when nothing more can be given."""
    ladder = session.ladder()
    if session.next_index < len(ladder):
        hint = ladder[session.next_index]
    elif len(session.extra_clues) < settings.MAX_EXTRA_HINTS:
        hint = generate_extra_hint(session)
        if hint is None:
            return None
        session.extra_clues.append(hint)
    else:
        return None
    session.next_index += 1
    return hint


def write_reply(session: GameSession, message: str, intent: str, hint: str | None) -> str:
    """Step 2: the narrator's reply. Sees only the unlocked hints."""
    unlocked = session.revealed()
    context = (
        f"MISSION TITLE: {session.mission.title}\n"
        f"MISSION TEXT: {session.mission.description}\n"
        f"UNLOCKED HINTS (hardest first): {json.dumps(unlocked, ensure_ascii=False) if unlocked else 'none yet'}\n"
        f"GAME RULES: {settings.GAME_RULES}\n"
        f"PLAYER INTENT: {intent}\n"
    )
    if intent == "hint":
        context += f"DELIVER THIS HINT NOW: {hint}\n{HINT_INSTRUCTIONS}" if hint else NO_MORE_HINTS
    elif intent == "answer_request":
        context += ANSWER_REQUEST_INSTRUCTIONS
    elif intent == "answer_attempt":
        context += ANSWER_ATTEMPT_INSTRUCTIONS.format(box=settings.ANSWER_BOX)

    messages = [{"role": "system", "content": f"{PERSONA}\n\n{context}"}]
    messages += session.history[-settings.HISTORY_MESSAGES:]
    messages.append({"role": "user", "content": message})

    args = _args()
    if settings.USE_WEB_SEARCH and intent == "question":
        args["tools"] = [settings.WEB_SEARCH_TOOL]
    return client.responses.create(input=messages, **args).output_text.strip()


def take_turn(session: GameSession, message: str) -> str:
    intent = classify(session, message)

    hint = next_hint(session) if intent == "hint" else None

    reply = None
    for _ in range(settings.MAX_RETRIES):
        text = write_reply(session, message, intent, hint)
        if text and not session.leaks(text):   # last line of defence against leaking the answer
            reply = text
            break

    if reply is None:
        reply = settings.ANSWER_ATTEMPT_FALLBACK if intent == "answer_attempt" else settings.FALLBACK_REPLY
        if hint is not None:
            session.next_index -= 1   # the player never saw this hint

    session.history.append({"role": "user", "content": message})
    session.history.append({"role": "assistant", "content": reply})
    return reply
