// Client for the Quest Assistant (AI_bot/backend). Separate from authService.js,
// which talks to the game's own API.
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL;

// POST a JSON body to the chatbot backend and return the parsed response.
async function postToChatbot(path, body) {
  if (!CHATBOT_API_URL) {
    throw new Error("Quest Assistant server is not configured.");
  }

  const response = await fetch(`${CHATBOT_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(`Quest Assistant request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// Start a chat session for one mission. Returns { session_id, title }.
export function startChatSession(missionId) {
  return postToChatbot("/start", { mission_id: missionId });
}

// Send one player message in an existing session. Returns { reply }.
export function sendChatMessage(sessionId, message) {
  return postToChatbot("/chat", { session_id: sessionId, message });
}
