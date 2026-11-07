import {
  mockLoginUser,
  mockRegisterUser,
  mockGetCurrentUser,
  mockLogoutUser,
} from "./mockAuthService.js";
import { apiRequest } from "./apiClient.js";

const API_URL = import.meta.env.VITE_API_URL;

// Mock authentication is allowed only in Vite development mode.
const USE_MOCK_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_AUTH === "true";
// Debug authentication configuration.
console.log("Development mode:", import.meta.env.DEV);
console.log("Mock authentication enabled:", USE_MOCK_AUTH);

// Authenticate the user.
export async function loginUser(email, password) {
  if (USE_MOCK_AUTH) {
    return mockLoginUser(email, password);
  }

  if (!API_URL) {
    throw new Error("Authentication server is not configured.");
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email: email.trim(),
      parola: password,
    }),
  });

  if (response.status === 401) {
    throw new Error("Invalid email or password.");
  }

  if (!response.ok) {
    throw new Error("Unable to log in. Please try again.");
  }

  return response.json();
}

// Register a new user.
export async function registerUser(username, email, password) {
  if (USE_MOCK_AUTH) {
    return mockRegisterUser(username, email, password);
  }

  if (!API_URL) {
    throw new Error("Authentication server is not configured.");
  }

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: username.trim(),
      email: email.trim(),
      parola: password,
    }),
  });

  if (response.status === 409) {
    throw new Error("An account with this email already exists.");
  }

  if (response.status === 400 || response.status === 422) {
    throw new Error("Invalid registration details.");
  }

  if (!response.ok) {
    throw new Error("Unable to create your account. Please try again.");
  }

  return response.json();
}

// Retrieve the current authenticated user.
export async function getCurrentUser() {
  if (USE_MOCK_AUTH) {
    return mockGetCurrentUser();
  }

  if (!API_URL) {
    throw new Error("Authentication server is not configured.");
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to retrieve the current user.");
  }

  const data = await response.json();

  return data.user;
}

// Retrieve the profile page data from the database: stats, adventure history, badges, join date.
// Returns null when nobody is logged in.
export async function getProfile() {
  if (USE_MOCK_AUTH) {
    return null;
  }

  if (!API_URL) {
    throw new Error("Authentication server is not configured.");
  }

  const response = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to retrieve your profile.");
  }

  return response.json();
}

// End the authenticated session.
export async function logoutUser() {
  if (USE_MOCK_AUTH) {
    return mockLogoutUser();
  }

  if (!API_URL) {
    throw new Error("Authentication server is not configured.");
  }

  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to log out. Please try again.");
  }
}

// Change the logged-in player's username, email or avatar. Only the fields passed are changed.
// Returns the updated user.
export async function updateProfile(fields) {
  const data = await apiRequest("/users/me", { method: "PATCH", body: fields });
  return data.user;
}

// Notification settings of the logged-in player.
export async function getSettings() {
  const data = await apiRequest("/users/me/settings");
  return data.settings;
}

export async function saveSettings(settings) {
  const data = await apiRequest("/users/me/settings", {
    method: "PUT",
    body: settings,
  });
  return data.settings;
}
