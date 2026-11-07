// Game calls: checking a location's answer with the player's GPS, and saving progress.
import { apiRequest } from "./apiClient.js";

// Ask the browser for the player's current position. Rejects if location is unavailable or denied.
export function getCurrentPosition() {
  // Test mode (VITE_NO_GPS=true, set by scripts/local.sh --no-gps): no browser prompt.
  // The server does not check the distance in that mode, so any position works.
  if (import.meta.env.VITE_NO_GPS === "true") {
    return Promise.resolve({ latitude: 0, longitude: 0 });
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser cannot read your location."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () =>
        reject(
          new Error(
            "Allow location access to verify that you are at this place.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

// Check the answer for one location. The server checks the GPS distance and the answer, then saves the result.
export function verifyLocationAnswer({ locationId, answer, latitude, longitude }) {
  return apiRequest("/validare-nivel", {
    method: "POST",
    body: { locationId, answer, latitude, longitude },
  });
}

// Locations the player completed, and total points.
export function getProgress() {
  return apiRequest("/progress");
}

// The riddle for a location, plus the hints the player has already opened (in order) and the hint cost.
export function getMission(locationId) {
  return apiRequest(`/locations/${encodeURIComponent(locationId)}/mission`);
}

// Open the next hint for a location. The server takes the hint cost from the player's points.
export function requestNextHint(locationId) {
  return apiRequest("/hints/next", {
    method: "POST",
    body: { locationId },
  });
}
