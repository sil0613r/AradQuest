// The locations of each adventure, in play order, with the number of clues at each one.
// Must match the locations in pages/AdventureDetailsPage.jsx. The server saves progress per location.
export const ADVENTURE_LOCATIONS = {
  nature: [{ id: "nature-location-1", clues: 3 }],
  history: [
    { id: "primaria-arad", clues: 3 },
    { id: "teatrul-ioan-slavici", clues: 1 },
    { id: "biserica-rosie", clues: 1 },
    { id: "moise-nicoara", clues: 1 },
    { id: "palatul-cultural", clues: 1 },
    { id: "vechiul-cazino", clues: 1 },
  ],
};
