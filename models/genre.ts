// Genre union type generated from all available genres in the application
export type Genre = 
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
  | "Politics"
  | "Science";

// Export the genre options for reuse across the application
export const GENRE_OPTIONS = [
  { label: "Adventure", value: "Adventure" }, // Phiêu lưu
  { label: "Comedy", value: "Comedy" }, // Hài hước
  { label: "Drama", value: "Drama" }, // Chính kịch
  { label: "Fantasy", value: "Fantasy" }, // Giả tưởng
  { label: "Historical", value: "Historical" }, // Lịch sử
  { label: "Horror", value: "Horror" }, // Kinh dị
  { label: "Mystery", value: "Mystery" }, // Bí ẩn
  { label: "Romance", value: "Romance" }, // Lãng mạn
  { label: "Sci-fi", value: "Sci-fi" }, // Khoa học viễn tưởng
  { label: "Slice of Life", value: "Slice of Life" }, // Đời thường
  { label: "Thriller", value: "Thriller" }, // Gay cấn
  { label: "Tragedy", value: "Tragedy" }, // Bi kịch
  { label: "Crime", value: "Crime" }, // Tội phạm
  { label: "Supernatural", value: "Supernatural" }, // Siêu nhiên
  { label: "Psychological", value: "Psychological" }, // Tâm lý
  { label: "Martial Arts", value: "Martial Arts" }, // Võ thuật
  { label: "Post-Apocalyptic", value: "Post-Apocalyptic" }, // Hậu tận thế
  { label: "Survival", value: "Survival" }, // Sinh tồn
  { label: "Reincarnation", value: "Reincarnation" }, // Luân hồi
  { label: "Time Travel", value: "Time Travel" }, // Du hành thời gian
  { label: "Steampunk", value: "Steampunk" }, // Steampunk
  { label: "Cyberpunk", value: "Cyberpunk" }, // Cyberpunk
  { label: "Magic", value: "Magic" }, // Ma thuật
  { label: "Military", value: "Military" }, // Quân sự
  { label: "Philosophical", value: "Philosophical" }, // Triết lý
  { label: "Wuxia", value: "Wuxia" }, // Võ hiệp (Wuxia)
  { label: "Xianxia", value: "Xianxia" }, // Tiên hiệp (Xianxia)
  { label: "Xuanhuan", value: "Xuanhuan" }, // Huyền huyễn (Xuanhuan)
  { label: "Sports", value: "Sports" }, // Thể thao
  { label: "Mecha", value: "Mecha" }, // Robot khổng lồ (Mecha)
  { label: "Vampires", value: "Vampires" }, // Ma cà rồng
  { label: "Zombies", value: "Zombies" }, // Xác sống
  { label: "Detective", value: "Detective" }, // Trinh thám
  { label: "School Life", value: "School Life" }, // Học đường
  { label: "Medical", value: "Medical" }, // Y khoa
  { label: "Music", value: "Music" }, // Âm nhạc
  { label: "Cooking", value: "Cooking" }, // Ẩm thực
  { label: "Game", value: "Game" }, // Trò chơi
  { label: "Virtual Reality", value: "Virtual Reality" }, // Thực tế ảo
  { label: "Politics", value: "Politics" }, // Chính trị
  { label: "Science", value: "Science" } // Khoa học
] as const; 