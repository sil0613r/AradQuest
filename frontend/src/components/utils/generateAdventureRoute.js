import { shuffleLocations } from "./shuffleLocations.js";

/**
 * Generate a randomized route for an adventure.
 *
 * This function does not modify the original locations array.
 * The generated order should eventually be stored by the backend.
 */
export function generateAdventureRoute(locations) {
  if (!Array.isArray(locations)) {
    return [];
  }

  // Shuffle the locations without modifying the original array.
  const randomizedLocations = shuffleLocations(locations);

  // Return a route containing only the location identifiers.
  return randomizedLocations.map((location) => location.id);
}

/**
 * Reconstruct the ordered locations using the route IDs.
 *
 * This allows the frontend to display a route generated
 * either locally or by the FastAPI backend.
 */
export function getOrderedLocations(locations, routeIds) {
  if (!Array.isArray(locations) || !Array.isArray(routeIds)) {
    return [];
  }

  const locationsById = new Map(
    locations.map((location) => [location.id, location]),
  );

  // Preserve the exact order supplied by the route.
  return routeIds.map((id) => locationsById.get(id)).filter(Boolean);
}
