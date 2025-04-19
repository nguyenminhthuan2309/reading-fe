import { BookCarousel } from "@/components/books/book-carousel";
import { SectionCarousel } from "@/components/books/section-carousel";
import { featuredBooks } from "@/lib/mock-data";
import Link from "next/link";
import { PenLine, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  // Sort books for popular section (keeping the data in case it's needed elsewhere)
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
  
  // New Releases (randomized selection for demo)
  const newReleases = [...featuredBooks]
    .sort(() => 0.5 - Math.random())
    .slice(0, 10);
  
  // Top Trending (highest ratings + random factor for demo)
  const topTrendingBooks = [...featuredBooks]
    .sort((a, b) => (b.rating * 0.7 + Math.random() * 0.3) - (a.rating * 0.7 + Math.random() * 0.3))
    .slice(0, 10);

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
      
      {/* New Releases Section */}
      <div>
        <SectionCarousel 
          title="New Releases" 
          books={newReleases} 
          linkHref="/books?category=new" 
          className="bg-section-dark"
        />
      </div>
      
      {/* Recently Updated Section */}
      <div>
        <SectionCarousel 
          title="Recently Updated" 
          books={recentlyUpdatedBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      {/* Top Trending Section */}
      <div>
        <SectionCarousel 
          title="Top Trending" 
          books={topTrendingBooks} 
          linkHref="/books?sort=trending" 
          className="bg-section-dark"
        />
      </div>
      
      {/* Recommended Section */}
      <div>
        <SectionCarousel 
          title="Recommended For You" 
          books={recommendedBooks} 
          linkHref="/books" 
          className="bg-section-light"
        />
      </div>
      
      {/* Call to Action Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/50 rounded-xl overflow-hidden">
              <div className="p-6 md:p-8">
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
                  Create Your Own Books & Earn Rewards
                </h2>
                <p className="text-gray-600 mb-8 max-w-2xl text-center mx-auto">
                  Join our community of writers and start earning rewards for your creativity. 
                  Publish your stories, build your audience, and get rewarded for your imagination.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Feature 1 */}
                  <div className="p-5 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <PenLine className="h-5 w-5 text-red-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Write Your Story</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Our easy-to-use editor helps you create beautiful books with chapters, images, and formatting.
                    </p>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="p-5 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <TrendingUp className="h-5 w-5 text-red-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Grow Your Audience</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Connect with readers who love your genre and build a loyal following for your work.
                    </p>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="p-5 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <Trophy className="h-5 w-5 text-red-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Earn Rewards</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Get paid for your creativity through our rewards program based on readers and engagement.
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link href="/books/create">
                    <Button size="lg" className="bg-red-700 hover:bg-red-800 text-white rounded-full px-8 font-semibold text-base">
                      Start Creating
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 