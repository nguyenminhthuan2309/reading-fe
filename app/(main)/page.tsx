import { BookCarousel } from "@/components/books/book-carousel";
import { SectionCarousel } from "@/components/books/section-carousel";
import { featuredBooks } from "@/lib/mock-data";

export default function Home() {
  // Sort books for popular section
  const popularBooks = [...featuredBooks].sort((a, b) => b.rating - a.rating);
  
  // Filter books for recommended section
  const recommendedBooks = featuredBooks.filter(
    book => ["Fantasy", "Science Fiction", "Cyberpunk", "Adventure", "Mystery"].includes(book.genre)
  );
  
  // Get recently viewed books (for demo, every other book from first 10)
  const recentlyViewedBooks = featuredBooks.slice(0, 10).filter((_, i) => i % 2 === 0);
  
  // Get recently updated books
  const recentlyUpdatedBooks = featuredBooks.slice(5, 15);

  return (
    <div className="flex flex-col bg-gradient-to-b from-black via-black to-red-950/30 min-h-screen">
      {/* Hero Section */}
      <BookCarousel />
      
      {/* First Section - Positioned to be partially visible initially */}
      <div className="bg-section-light bg-black/50 -mt-[5vh]">
        <SectionCarousel 
          title="Recently Viewed" 
          books={recentlyViewedBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      <div className="bg-section-dark bg-black/70">
        <SectionCarousel 
          title="Recently Updated" 
          books={recentlyUpdatedBooks} 
          linkHref="/books" 
          className="bg-section-dark"
        />
      </div>
      
      <div className="bg-section-light bg-black/50">
        <SectionCarousel 
          title="Popular Books" 
          books={popularBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      <div className="bg-section-dark bg-black/70">
        <SectionCarousel 
          title="Recommended For You" 
          books={recommendedBooks} 
          linkHref="/books" 
          className="bg-section-dark"
        />
      </div>
    </div>
  );
} 