// Game calls: checking a location's answer with the player's GPS, and saving progress.
import { apiRequest } from "./apiClient.js";

// Ask the browser for the player's current position. Rejects if location is unavailable or denied.
export function getCurrentPosition() {
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

// Clear the player's progress on one adventure and take back its points.
export function resetAdventureProgress(adventureId) {
  return apiRequest("/progress/reset", {
    method: "POST",
    body: { adventureId },
  });
}
