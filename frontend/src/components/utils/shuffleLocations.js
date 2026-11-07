/**
 * Randomly shuffle locations using the Fisher-Yates algorithm.
 *
 * The original array remains unchanged.
 */
export function shuffleLocations(locations) {
  const shuffled = [...locations];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
