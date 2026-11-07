// Shared request helper for the game API (FastAPI in api/). Sends the session cookie with every call.
const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

function messageFor(status, data) {
  // FastAPI sends {"detail": "..."} for our own errors. Validation errors come as a list, so use a plain message.
  if (typeof data?.detail === "string") return data.detail;
  if (status === 422) return "Please check the values you entered.";
  return FALLBACK_MESSAGE;
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  if (!API_URL) {
    throw new ApiError(0, "Game server is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, messageFor(response.status, data));
  }

  return data;
}
