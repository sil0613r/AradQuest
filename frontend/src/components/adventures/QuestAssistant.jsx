import { useEffect, useRef, useState } from "react";

import aradQuestAiLogo from "../../assets/images/aradquest-aiLogo.png";
import {
  sendChatMessage,
  startChatSession,
} from "../services/chatbotService.js";

const WELCOME_MESSAGE =
  "Hi, explorer! 👋 I'm your Quest Assistant. Need some help solving your current clue?";

const NO_MISSION_MESSAGE =
  "The Quest Assistant is not available for this location yet.";

// Turn a failed chatbot request into a message the player can read.
function describeChatError(error) {
  if (error.status === 404) {
    return "Your chat session expired. Please send your message again.";
  }

  if (error.status === 429) {
    return "Too many messages. Please wait a moment and try again.";
  }

  return "Connection lost. Please try again.";
}

// Floating chat for one mission. Remount it (use a key) to start a fresh chat.
export default function QuestAssistant({ missionId, chatOpen, setChatOpen }) {
  const [messages, setMessages] = useState([
    { id: 0, who: "bot", text: WELCOME_MESSAGE },
  ]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const nextIdRef = useRef(1);
  const messagesRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (who, text, pending = false) => {
    const id = nextIdRef.current++;
    setMessages((previous) => [...previous, { id, who, text, pending }]);
    return id;
  };

  const replaceMessage = (id, text) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id ? { ...message, text, pending: false } : message,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = draft.trim();

    if (!text || !missionId || isSending) return;

    setDraft("");
    setIsSending(true);
    addMessage("user", text);
    const pendingId = addMessage("bot", "…", true);

    try {
      // Start a session the first time the player writes in this chat.
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const session = await startChatSession(missionId);
        activeSessionId = session.session_id;
        setSessionId(activeSessionId);
      }

      const data = await sendChatMessage(activeSessionId, text);
      replaceMessage(pendingId, data.reply);
    } catch (error) {
      // 404 means the server forgot the session: the next message starts a new one.
      if (error.status === 404) {
        setSessionId(null);
      }

      replaceMessage(pendingId, describeChatError(error));
    } finally {
      setIsSending(false);
    }
  };

  const canChat = Boolean(missionId);

  return (
    <div className="floating-ai-chat">
      {/* Chat window */}

      {chatOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <img
                src={aradQuestAiLogo}
                alt="Arad Quest AI"
                className="ai-chat-header-logo"
              />

              <div>
                <h3>Quest Assistant</h3>

                <span>Your adventure companion</span>
              </div>
            </div>

            <button
              className="ai-chat-close"
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Chat messages */}

          <div className="ai-chat-messages" ref={messagesRef} aria-live="polite">
            {!canChat && (
              <div className="ai-chat-message">
                <p>{NO_MISSION_MESSAGE}</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.who === "user"
                    ? "ai-chat-message ai-chat-message--user"
                    : `ai-chat-message${message.pending ? " ai-chat-message--pending" : ""}`
                }
              >
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          {/* Chat input */}

          <form className="ai-chat-input-area" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask me something..."
              maxLength={500}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!canChat}
            />

            <button
              type="submit"
              disabled={!canChat || isSending || !draft.trim()}
              aria-label="Send message"
              title={canChat ? "Send" : NO_MISSION_MESSAGE}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating AI logo button */}

      <button
        className="ai-chat-floating-button"
        type="button"
        onClick={() => setChatOpen((previous) => !previous)}
        aria-label={chatOpen ? "Close AI chat" : "Open AI chat"}
      >
        <img src={aradQuestAiLogo} alt="AI Chatbot" />
      </button>
    </div>
  );
}
