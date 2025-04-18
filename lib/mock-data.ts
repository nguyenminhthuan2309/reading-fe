import { Genre } from "@/models/genre";

export const featuredBooks = [
  {
    id: "1",
    title: "The Shadow's Embrace",
    author: "Eliza Morgan",
    description: "A gripping tale of mystery and suspense that follows detective Sarah Chen as she unravels a series of unexplained disappearances in the small coastal town of Maplewood.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 24,
    rating: 4.7,
    genre: "Mystery" as Genre,
    progress: 0.35 // 35% read
  },
  {
    id: "2",
    title: "Beyond the Stars",
    author: "Marcus Reid",
    description: "An epic space adventure that charts the journey of the starship Odysseus and its diverse crew as they explore uncharted galaxies and encounter advanced civilizations.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 36,
    rating: 4.9,
    genre: "Sci-fi" as Genre,
    progress: 0 // not started
  },
  {
    id: "3",
    title: "Whispers of the Heart",
    author: "Sophia Lee",
    description: "A touching romance set in 1920s Paris, following aspiring artist Emma and novelist Thomas as they navigate love, ambition, and the vibrant art scene of the era.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 18,
    rating: 4.5,
    genre: "Romance" as Genre,
    progress: 0.78 // 78% read
  },
  {
    id: "4",
    title: "The Lost Kingdom",
    author: "Alexander Wright",
    description: "An immersive fantasy adventure where a young orphan discovers her magical heritage and embarks on a quest to reclaim a forgotten kingdom from dark forces.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 42,
    rating: 4.8,
    genre: "Fantasy" as Genre,
    progress: 0 // not started
  },
  {
    id: "5",
    title: "Midnight Hunter",
    author: "Victoria Blake",
    description: "In a world where supernatural creatures hide among humans, elite hunter Elise must track down a rogue vampire while confronting her own dark past and forbidden attractions.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 31,
    rating: 4.6,
    genre: "Supernatural" as Genre,
    progress: 0.15 // 15% read
  },
  {
    id: "6",
    title: "The Code Breaker",
    author: "Daniel Martinez",
    description: "A brilliant mathematician is recruited by a secret government agency to crack an impossible code that could prevent a global catastrophe, but nothing is as it seems.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 28,
    rating: 4.4,
    genre: "Thriller" as Genre,
    progress: 0.42 // 42% read
  },
  {
    id: "7",
    title: "Echoes of Time",
    author: "Amara Johnson",
    description: "When an archaeologist discovers an ancient artifact with time-altering properties, she finds herself journeying through history and facing choices that could reshape the future.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 35,
    rating: 4.7,
    genre: "Historical" as Genre,
    progress: 0 // not started
  },
  {
    id: "8",
    title: "Silent Shadows",
    author: "James Blackwood",
    description: "In a small town plagued by mysterious disappearances, a troubled detective with a psychic ability must confront his own demons to stop a killer who leaves no traces.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 22,
    rating: 4.3,
    genre: "Crime" as Genre,
    progress: 0.05 // just started
  },
  {
    id: "9",
    title: "Quantum Dreams",
    author: "Olivia Chen",
    description: "A pioneering scientist develops technology to enter dreams, but when subjects begin dying in their sleep, she must navigate the boundaries between reality and consciousness.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 29,
    rating: 4.8,
    genre: "Sci-fi" as Genre,
    progress: 0.63 // 63% read
  },
  {
    id: "10",
    title: "The Last Guardian",
    author: "Michael Rivers",
    description: "The last member of an ancient order must protect a child prophesied to restore balance to a world torn apart by war between humans and magical creatures.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 40,
    rating: 4.9,
    genre: "Fantasy" as Genre,
    progress: 0 // not started
  },
  {
    id: "11",
    title: "Neon Shadows",
    author: "Zoe Nakamura",
    description: "In a cyberpunk metropolis controlled by corporations, a hacker with enhanced abilities uncovers a conspiracy that threatens to enslave humanity through neural implant technology.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 33,
    rating: 4.7,
    genre: "Cyberpunk" as Genre,
    progress: 0.22 // 22% read
  },
  {
    id: "12",
    title: "Blooms in Winter",
    author: "Hannah Peterson",
    description: "After inheriting her grandmother's flower shop, a young woman discovers a collection of letters that reveal a decades-old romance and family secrets that change everything.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 20,
    rating: 4.6,
    genre: "Drama" as Genre,
    progress: 0.91 // 91% read, almost finished
  },
  {
    id: "13",
    title: "Empire of Sand",
    author: "Raj Kumar",
    description: "In a desert empire inspired by ancient Persia, a nomad with the rare ability to control sand must navigate court politics and ancient magic to prevent an apocalyptic prophecy.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 38,
    rating: 4.8,
    genre: "Fantasy" as Genre,
    progress: 0 // not started
  },
  {
    id: "14",
    title: "The Forgotten Protocol",
    author: "Thomas Gibson",
    description: "When a military AI designed to predict terrorism begins targeting innocent civilians, its creator must team up with an FBI agent to uncover who reprogrammed it and why.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 26,
    rating: 4.5,
    genre: "Thriller" as Genre,
    progress: 0.53 // 53% read
  },
  {
    id: "15",
    title: "Beneath the Waves",
    author: "Marina Koralova",
    description: "A marine biologist discovers an underwater civilization while investigating mysterious oceanic signals, but revealing its existence could lead to its destruction.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 32,
    rating: 4.4,
    genre: "Adventure" as Genre,
    progress: 0.08 // just started
  },
  {
    id: "16",
    title: "Whispers in the Wind",
    author: "Aria Nightshade",
    description: "A haunting tale of a small town where the winds carry secrets and whispers of the past, and a young woman who can hear them all, uncovering dark truths long buried.",
    coverImage: "/images/book-cover.jpeg",
    chapters: 27,
    rating: 4.8,
    genre: "Mystery" as Genre,
    progress: 0.82 // 82% read
  }
];

// Mock comments data
export const bookComments = {
  "1": [
    {
      id: "c1",
      userId: "user1",
      username: "bookworm42",
      userAvatar: "/images/avatar.png",
      content: "This book kept me on the edge of my seat the entire time! Detective Sarah Chen is an incredibly well-written character.",
      rating: 5,
      timestamp: "2023-10-15T14:30:00Z"
    },
    {
      id: "c2",
      userId: "user2",
      username: "mystery_lover",
      userAvatar: "/images/avatar.png",
      content: "The setting of Maplewood was so vivid, I felt like I was there. Great atmosphere!",
      rating: 4,
      timestamp: "2023-10-12T09:15:00Z"
    },
    {
      id: "c3",
      userId: "user3",
      username: "late_night_reader",
      userAvatar: "/images/avatar.png",
      content: "The twist in chapter 15 completely caught me off guard. Brilliant storytelling.",
      rating: 5,
      timestamp: "2023-10-10T22:45:00Z"
    },
    {
      id: "c13",
      userId: "user13",
      username: "thriller_fan",
      userAvatar: "/images/avatar.png",
      content: "The tension in this book builds so perfectly. I love how the author slowly unravels the mystery and keeps you guessing until the very end.",
      rating: 5,
      timestamp: "2023-10-09T15:45:00Z"
    },
    {
      id: "c14",
      userId: "user14",
      username: "book_nerd99",
      userAvatar: "/images/avatar.png",
      content: "I found the pacing a bit slow in the middle, but the ending more than made up for it. Great character development!",
      rating: 4,
      timestamp: "2023-10-08T11:30:00Z"
    },
    {
      id: "c15",
      userId: "user15",
      username: "crime_fiction_lover",
      userAvatar: "/images/avatar.png",
      content: "As a long-time reader of crime novels, I found this one particularly refreshing. The attention to forensic details is impressive.",
      rating: 5,
      timestamp: "2023-10-07T17:22:00Z"
    },
    {
      id: "c16",
      userId: "user16",
      username: "book_critic",
      userAvatar: "/images/avatar.png",
      content: "While the plot was engaging, I felt some of the side characters weren't developed enough. Still enjoyed it overall.",
      rating: 3,
      timestamp: "2023-10-06T09:15:00Z"
    },
    {
      id: "c17",
      userId: "user17",
      username: "avid_reader",
      userAvatar: "/images/avatar.png",
      content: "I finished this in one sitting! The way the author connects seemingly unrelated events is masterful. Can't wait for the sequel!",
      rating: 5,
      timestamp: "2023-10-05T20:40:00Z"
    }
  ],
  "2": [
    {
      id: "c4",
      userId: "user4",
      username: "sci_fi_fanatic",
      userAvatar: "/images/avatar.png",
      content: "The world-building in this book is absolutely phenomenal. The descriptions of alien civilizations are so creative!",
      rating: 5,
      timestamp: "2023-10-14T16:20:00Z"
    },
    {
      id: "c5",
      userId: "user5",
      username: "space_explorer",
      userAvatar: "/images/avatar.png",
      content: "Captain Mira is one of the most compelling protagonists I've encountered in sci-fi lately.",
      rating: 4,
      timestamp: "2023-10-11T11:05:00Z"
    }
  ],
  "3": [
    {
      id: "c6",
      userId: "user6",
      username: "romance_addict",
      userAvatar: "/images/avatar.png",
      content: "The chemistry between Emma and Thomas is electric! I couldn't put this book down.",
      rating: 5,
      timestamp: "2023-10-13T20:10:00Z"
    }
  ],
  "4": [
    {
      id: "c7",
      userId: "user7",
      username: "fantasy_dreamer",
      userAvatar: "/images/avatar.png",
      content: "The worldbuilding in this book is absolutely incredible. I was transported to the lost kingdom from the very first page.",
      rating: 5,
      timestamp: "2023-10-15T19:45:00Z"
    },
    {
      id: "c8",
      userId: "user8",
      username: "bookish_wanderer",
      userAvatar: "/images/avatar.png",
      content: "The protagonist's journey from orphan to hero was so well developed. You can really feel her growth throughout the story.",
      rating: 4,
      timestamp: "2023-10-14T13:20:00Z"
    }
  ],
  "9": [
    {
      id: "c9",
      userId: "user9",
      username: "neural_navigator",
      userAvatar: "/images/avatar.png",
      content: "As someone who works in neuroscience, I found the dream technology fascinating and surprisingly plausible. Great research by the author.",
      rating: 5,
      timestamp: "2023-10-16T11:30:00Z"
    }
  ],
  "16": [
    {
      id: "c10",
      userId: "user10",
      username: "wind_whisperer",
      userAvatar: "/images/avatar.png",
      content: "This book gave me chills! The atmosphere is so eerie and the main character's ability to hear the whispers is described in such a visceral way.",
      rating: 5,
      timestamp: "2023-10-12T22:15:00Z"
    },
    {
      id: "c11",
      userId: "user11",
      username: "mystery_maven",
      userAvatar: "/images/avatar.png",
      content: "I thought I had figured out the twist halfway through, but I was completely wrong. The ending floored me!",
      rating: 5,
      timestamp: "2023-10-10T18:40:00Z"
    },
    {
      id: "c12",
      userId: "user12",
      username: "page_turner",
      userAvatar: "/images/avatar.png",
      content: "I literally stayed up all night to finish this book. The pacing is perfect and the characters feel so real.",
      rating: 4,
      timestamp: "2023-10-08T09:55:00Z"
    }
  ]
};

// Function to get related books based on genre
export function getRelatedBooks(bookId: string, limit: number = 4) {
  const book = featuredBooks.find(b => b.id === bookId);
  if (!book) return [];
  
  // Get books with the same genre, excluding the current book
  const sameGenreBooks = featuredBooks
    .filter(b => b.genre === book.genre && b.id !== book.id);
  
  // If we don't have enough books of the same genre, add some other popular books
  if (sameGenreBooks.length < limit) {
    const otherPopularBooks = featuredBooks
      .filter(b => b.genre !== book.genre && b.id !== book.id)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit - sameGenreBooks.length);
    
    return [...sameGenreBooks, ...otherPopularBooks].slice(0, limit);
  }
  
  return sameGenreBooks.slice(0, limit);
} 