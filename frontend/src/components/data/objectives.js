import natureImage from "../../assets/images/backgrounds/nature-adventure.JPG";
import historyImage from "../../assets/images/backgrounds/history-adventure.JPG";

export const demoObjectives = [
  // NATURE ADVENTURE
  {
    id: "nature-1",
    adventureId: "nature",
    name: "The First Discovery",
    category: "Nature",
    latitude: 46.1667,
    longitude: 21.3167,
    image: natureImage,
    story:
      "Your first natural discovery in Arad. Continue your journey to uncover more secrets.",
    isFinal: false,
  },
  {
    id: "nature-2",
    adventureId: "nature",
    name: "The Hidden Path",
    category: "Nature",
    latitude: 46.1725,
    longitude: 21.325,
    image: natureImage,
    story:
      "You have uncovered another secret. Nature has more discoveries waiting for you.",
    isFinal: false,
  },
  {
    id: "nature-3",
    adventureId: "nature",
    name: "The Final Nature Challenge",
    category: "Nature",
    latitude: 46.178,
    longitude: 21.333,
    image: natureImage,
    story:
      "Congratulations, explorer! You have completed your Nature adventure.",
    isFinal: true,
  },

  // HISTORY ADVENTURE
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
    name: "The Final Historical Challenge",
    category: "History",
    latitude: 46.18,
    longitude: 21.3,
    image: historyImage,
    story: "Your historical adventure is complete. You are a true explorer!",
    isFinal: true,
  },
];
