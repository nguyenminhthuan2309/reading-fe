// Genre union type generated from all available genres in the application
export type Genre =
  | "Action"
  | "Adventure"
  | "Comedy"
  | "Drama"
  | "Fantasy"
  | "Historical"
  | "Horror"
  | "Mystery"
  | "Romance"
  | "Sci-fi"
  | "Slice of Life"
  | "Thriller"
  | "Tragedy"
  | "Crime"
  | "Supernatural"
  | "Psychological"
  | "Martial Arts"
  | "Post-Apocalyptic"
  | "Survival"
  | "Reincarnation"
  | "Time Travel"
  | "Steampunk"
  | "Cyberpunk"
  | "Magic"
  | "Military"
  | "Philosophical"
  | "Wuxia"
  | "Xianxia"
  | "Xuanhuan"
  | "Sports"
  | "Mecha"
  | "Vampires"
  | "Zombies"
  | "Detective"
  | "School Life"
  | "Medical"
  | "Music"
  | "Cooking"
  | "Game"
  | "Virtual Reality"
  | "Space"
  | "Science";

 
    export const DEFAULT_GENRES = [
      { id: 1, name: "Action" },
      { id: 2, name: "Adventure" },
      { id: 3, name: "Comedy" },
      { id: 4, name: "Drama" },
      { id: 5, name: "Fantasy" },
      { id: 6, name: "Historical" },
      { id: 7, name: "Horror" },
      { id: 8, name: "Mystery" },
      { id: 9, name: "Romance" },
      { id: 10, name: "Sci-fi" },
      { id: 11, name: "Slice of Life" },
      { id: 12, name: "Thriller" },
      { id: 13, name: "Tragedy" },
      { id: 14, name: "Crime" },
      { id: 15, name: "Supernatural" },
      { id: 16, name: "Psychological" },
      { id: 17, name: "Martial Arts" },
      { id: 18, name: "Post-Apocalyptic" },
      { id: 19, name: "Survival" },
      { id: 20, name: "Reincarnation" },
      { id: 21, name: "Time Travel" },
      { id: 22, name: "Steampunk" },
      { id: 23, name: "Cyberpunk" },
      { id: 24, name: "Magic" },
      { id: 25, name: "Military" },
      { id: 26, name: "Philosophical" },
      { id: 27, name: "Wuxia" },
      { id: 28, name: "Xianxia" },
      { id: 29, name: "Xuanhuan" },
      { id: 30, name: "Sports" },
      { id: 31, name: "Mecha" },
      { id: 32, name: "Vampires" },
      { id: 33, name: "Zombies" },
      { id: 34, name: "Detective" },
      { id: 35, name: "School Life" },
      { id: 36, name: "Medical" },
      { id: 37, name: "Music" },
      { id: 38, name: "Cooking" },
      { id: 39, name: "Game" },
      { id: 40, name: "Virtual Reality" },
      { id: 41, name: "Space" },
      { id: 42, name: "Science" }
    ] as const;
  
  export const GENRE_GROUP_NAMES_MAPING = {
    actionAdventure: "Action & Adventure",
    fantasySupernatural: "Fantasy & Supernatural",
    psychologicalDrama: "Psychological & Drama",
    mysteryCrime: "Mystery & Crime",
    romanceSliceOfLife: "Romance & Slice of Life",
    sciFiFuturistic: "Sci-Fi & Futuristic",
    survivalApocalyptic: "Survival & Apocalyptic",
  }

export const GENRE_GROUPS = {
    actionAdventure: [
      "Action",
      "Adventure",
      "Martial Arts",
      "Military",
      "Sports"
    ],
    fantasySupernatural: [
      "Fantasy",
      "Magic",
      "Supernatural",
      "Wuxia",
      "Xianxia",
      "Xuanhuan",
      "Vampires",
      "Zombies"
    ],
    psychologicalDrama: [
      "Psychological",
      "Philosophical",
      "Tragedy",
      "Drama",
      "Thriller",
      "Historical",
      "Science"
    ],
    mysteryCrime: [
      "Mystery",
      "Detective",
      "Crime",
      "Horror"
    ],
    romanceSliceOfLife: [
      "Romance",
      "Slice of Life",
      "School Life",
      "Music",
      "Cooking",
      "Medical",
      "Comedy"
    ],
    sciFiFuturistic: [
      "Sci-fi",
      "Cyberpunk",
      "Steampunk",
      "Space",
      "Virtual Reality",
      "Time Travel",
      "Reincarnation",
      "Mecha"
    ],
    survivalApocalyptic: [
      "Post-Apocalyptic",
      "Survival",
      "Game"
    ]
  };