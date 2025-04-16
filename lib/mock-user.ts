// Mock user data
export const currentUser = {
  id: "1",
  username: "manga_lover",
  name: "Alex Johnson",
  email: "alex@example.com",
  avatar: "/images/avatar.png", // we'll use a placeholder
  bio: "Avid manga and light novel reader. I love fantasy, sci-fi, and slice-of-life genres. Currently binging through all the latest releases!",
  joinedDate: "2023-03-15",
  readingStats: {
    booksRead: 24,
    chaptersRead: 342,
    hoursRead: 112,
    avgRating: 4.2
  },
  preferences: {
    favorites: ["Mystery", "Science Fiction", "Fantasy"],
    readingSpeed: "Medium",
    theme: "Dark"
  },
  bookmarks: ["3", "10", "11"],
  recentlyRead: ["5", "1", "4", "7"],
  currentlyReading: [
    {
      bookId: "1",
      progress: 0.35,
      lastReadChapter: 8,
      lastReadDate: "2023-09-28"
    },
    {
      bookId: "9",
      progress: 0.63,
      lastReadChapter: 18,
      lastReadDate: "2023-10-02"
    },
    {
      bookId: "12",
      progress: 0.91,
      lastReadChapter: 19,
      lastReadDate: "2023-10-05"
    }
  ]
}; 