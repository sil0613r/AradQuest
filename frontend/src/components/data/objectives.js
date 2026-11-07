import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";

// Discovery cards shown on the map: 5 for the Nature adventure and 6 for the
// History adventure. The last objective of each adventure is the final one.
export const demoObjectives = [
  // NATURE ADVENTURE (5 discoveries, same places as ai_bot/backend/missions.json)
  // TODO: Verify the map coordinates of each park.
  {
    id: "nature-1",
    adventureId: "nature",
    name: "Parcul Micalaca – Zona 300",
    category: "Nature",
    latitude: 46.1678101,
    longitude: 21.3421142,
    image: natureImage,
    story:
      "A green space at the edge of Micalaca, where the city meets the Mures riverside.",
    isFinal: false,
  },
  {
    id: "nature-2",
    adventureId: "nature",
    name: "Parcul Europa",
    category: "Nature",
    latitude: 46.178438,
    longitude: 21.331454,
    image: natureImage,
    story:
      "A corner of greenery close to the Mures bank, with small colorful shelters along the paths.",
    isFinal: false,
  },
  {
    id: "nature-3",
    adventureId: "nature",
    name: "Parcul de la Podgoria",
    category: "Nature",
    latitude: 46.183437,
    longitude: 21.32261,
    image: natureImage,
    story:
      "A quiet park near the Podgoria lake, where a bust keeps an important story alive.",
    isFinal: false,
  },
  {
    id: "nature-4",
    adventureId: "nature",
    name: "Parcul Copiilor",
    category: "Nature",
    latitude: 46.173424,
    longitude: 21.320762,
    image: natureImage,
    story:
      "A place of play, trees and paths, where children find a new adventure every day.",
    isFinal: false,
  },
  {
    id: "nature-5",
    adventureId: "nature",
    name: "Faleza Mureșului – zona Gloria",
    category: "Nature",
    latitude: 46.166411,
    longitude: 21.325142,
    image: natureImage,
    story:
      "Congratulations, explorer! You have completed your Nature adventure on the Mures riverside.",
    isFinal: true,
  },

  // HISTORY ADVENTURE (6 discoveries)
  {
    id: "history-1",
    adventureId: "history",
    name: "A Story in Stone",
    category: "History",
    latitude: 46.17,
    longitude: 21.31,
    image: historyImage,
    story:
      "A historical discovery has been unlocked. The story of Arad continues.",
    isFinal: false,
  },
  {
    id: "history-2",
    adventureId: "history",
    name: "Echoes of the Past",
    category: "History",
    latitude: 46.175,
    longitude: 21.305,
    image: historyImage,
    story: "You have discovered another piece of Arad's history.",
    isFinal: false,
  },
  {
    id: "history-3",
    adventureId: "history",
    name: "The Old Square",
    category: "History",
    latitude: 46.1725,
    longitude: 21.308,
    image: historyImage,
    story: "Between the old facades, the square still remembers its past.",
    isFinal: false,
  },
  {
    id: "history-4",
    adventureId: "history",
    name: "Behind the Walls",
    category: "History",
    latitude: 46.1745,
    longitude: 21.299,
    image: historyImage,
    story: "Stone walls hold stories that were never written in books.",
    isFinal: false,
  },
  {
    id: "history-5",
    adventureId: "history",
    name: "The Forgotten Chapel",
    category: "History",
    latitude: 46.1765,
    longitude: 21.304,
    image: historyImage,
    story: "A quiet chapel, forgotten for decades, reveals its secret.",
    isFinal: false,
  },
  {
    id: "history-6",
    adventureId: "history",
    name: "The Final Historical Challenge",
    category: "History",
    latitude: 46.18,
    longitude: 21.3,
    image: historyImage,
    story: "Your historical adventure is complete. You are a true explorer!",
    isFinal: true,
  },
];
