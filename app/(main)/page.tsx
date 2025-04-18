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
  const recentlyViewedBooks = [
    featuredBooks.find(book => book.id === "16"), // Our new book
    ...featuredBooks.slice(0, 10).filter((_, i) => i % 2 === 0)
  ].filter(Boolean);
  
  // Get recently updated books
  const recentlyUpdatedBooks = featuredBooks.slice(5, 15);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <BookCarousel />
      
      {/* Spacer between hero and first section */}
      <div className="h-8"></div>
      
      {/* Recent Read Section */}
      <div>
        <SectionCarousel 
          title="Recent Read" 
          books={recentlyViewedBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      {/* Recently Updated Section */}
      <div>
        <SectionCarousel 
          title="Recently Updated" 
          books={recentlyUpdatedBooks} 
          linkHref="/books" 
          className="bg-section-dark"
        />
      </div>
      
      {/* Popular Books Section */}
      <div>
        <SectionCarousel 
          title="Popular Books" 
          books={popularBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      {/* Recommended Section */}
      <div>
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