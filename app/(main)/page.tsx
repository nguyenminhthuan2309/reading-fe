"use client";

import { BookCarousel } from "@/components/books/book-carousel";
import { SectionCarousel } from "@/components/books/section-carousel";
import Link from "next/link";
import { PenLine, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserReadingHistory, getBooks, getTrendingBooks, getRecommendedBooks } from "@/lib/api/books";
import { ReadingHistoryItem, SortTypeEnum, AccessStatusEnum, Book } from "@/models/book";
import { useQuery } from "@tanstack/react-query";
import { BOOK_KEYS } from "@/lib/constants/query-keys";
import { useUserStore } from "@/lib/store/useUserStore";

export default function Home() {
  const { isLoggedIn } = useUserStore();
  // Fetch reading history using React Query
  const { data: readingHistoryData, isLoading } = useQuery({
    queryKey: BOOK_KEYS.RECENTLY_READ,
    queryFn: async () => {
      const response = await getUserReadingHistory({
        page: 1,
        limit: 10
      });
      
      if (response.status === 200) {
        return response.data;
      }

      throw new Error(response.msg || 'Failed to fetch reading history');
    },
    // On error, don't retry and silently fail - we'll show fallback data
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
    enabled: isLoggedIn
  });

  const mapReadHistory = readingHistoryData?.data?.map((book: Book) => ({
    ...book,
    readingProgress: {
      totalReadChapters: book.chaptersRead?.length || 0,
      lastReadChapterNumber: book.chaptersRead?.[0]?.chapter || 0,
      lastReadChapterId: book.chaptersRead?.[0]?.id || 0,
    },
  }));
  
  // Fetch new releases using React Query - sorted by creation date
  const { data: newReleasesData, isLoading: isLoadingNewReleases } = useQuery({
    queryKey: BOOK_KEYS.NEW_RELEASES,
    queryFn: async () => {
      const response = await getBooks({
        page: 1,
        limit: 10,
        sortBy: 'createdAt', // Sort by creation date
        sortType: SortTypeEnum.DESC, // Descending order (newest first)
        accessStatusId: AccessStatusEnum.PUBLISHED // Only published books
      });

      
      if (response.status === 200) {
        return response.data.data;
      }
      throw new Error(response.msg || 'Failed to fetch new releases');
    },
    // On error, don't retry and silently fail - we'll show fallback data
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Fetch recently updated books using React Query - sorted by updatedAt date
  const { data: recentlyUpdatedData, isLoading: isLoadingRecentlyUpdated } = useQuery({
    queryKey: BOOK_KEYS.RECENTLY_UPDATED,
    queryFn: async () => {
      const response = await getBooks({
        page: 1,
        limit: 10,
        sortBy: 'updatedAt', // Sort by update date
        sortType: SortTypeEnum.DESC, // Descending order (most recent first)
        accessStatusId: AccessStatusEnum.PUBLISHED // Only published books
      });
      
      if (response.status === 200) {
        return response.data.data;
      }
      throw new Error(response.msg || 'Failed to fetch recently updated books');
    },
    // On error, don't retry and silently fail - we'll show fallback data
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Fetch trending books using React Query
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: BOOK_KEYS.TRENDING,
    queryFn: async () => {
      const response = await getTrendingBooks({
        page: 1,
        limit: 10
      });
      
      if (response.status === 200) {
        return response.data.data;
      }
      throw new Error(response.msg || 'Failed to fetch trending books');
    },
    // On error, don't retry and silently fail - we'll show fallback data
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false
  });
  
  // Fetch recommended books using React Query
  const { data: recommendedData, isLoading: isLoadingRecommended } = useQuery({
    queryKey: BOOK_KEYS.RECOMMENDED,
    queryFn: async () => {
      const response = await getRecommendedBooks({
        limit: 10
      });

      if (response.status === 200) {
        return response.data;
      }
      throw new Error(response.msg || 'Failed to fetch recommended books');
    },
    // On error, don't retry and silently fail - we'll show fallback data
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false
  });



  return (
    <div className="flex flex-col min-h-screen dark:bg-gray-900">
      {/* Hero Section */}
      <BookCarousel books={trendingData || []} isLoading={isLoadingTrending} />
      
      {/* Spacer between hero and first section */}
      <div className="h-8 dark:bg-gray-900"></div>
      
      {/* Recent Read Section */}
      {isLoggedIn && (
        <div>
          <SectionCarousel 
            title="Recent Read" 
            books={mapReadHistory || []} 
            linkHref="/me?section=history" 
            className="bg-section-light dark:bg-gray-900"
            isLoading={isLoading}
          />
        </div>
      )}
      
      {/* New Releases Section */}
      <div>
        <SectionCarousel 
          title="New Releases" 
          books={newReleasesData || []} 
          linkHref="/books?category=new" 
          className="bg-section-dark dark:bg-gray-800"
          isLoading={isLoadingNewReleases}
        />
      </div>
      
      {/* Recently Updated Section */}
      <div>
        <SectionCarousel 
          title="Recently Updated" 
          books={recentlyUpdatedData || []} 
          linkHref="/books?sortBy=updatedAt_desc" 
          className="bg-section-light dark:bg-gray-900"
          isLoading={isLoadingRecentlyUpdated}
        />
      </div>
      
      {/* Top Trending Section */}
      <div>
        <SectionCarousel 
          title="Top Trending" 
          books={trendingData || []} 
          linkHref="/books?sortBy=views_desc" 
          className="bg-section-dark dark:bg-gray-800"
          isLoading={isLoadingTrending}
        />
      </div>
      
      {/* Recommended Section */}
      {isLoggedIn && (
        <div>
          <SectionCarousel 
            title="Recommended For You" 
            books={recommendedData || []} 
            linkHref="/books" 
            className="bg-section-light dark:bg-gray-900"
            isLoading={isLoadingRecommended}
          />
        </div>
      )}
      
      {/* Call to Action Section */}
      <div className="py-16 pb-24 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl overflow-hidden border dark:border-gray-700">
              <div className="p-6 md:p-8">
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                  Create Your Own Books & Earn Rewards
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl text-center mx-auto">
                  Join our community of writers and start earning rewards for your creativity. 
                  Publish your stories, build your audience, and get rewarded for your imagination.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Feature 1 */}
                  <div className="p-5 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center mb-3">
                      <div className="bg-amber-100 dark:bg-yellow-900/30 p-2 rounded-full mr-3">
                        <PenLine className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Write Your Story</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Our easy-to-use editor helps you create beautiful books with chapters, images, and formatting.
                    </p>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="p-5 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center mb-3">
                      <div className="bg-amber-100 dark:bg-yellow-900/30 p-2 rounded-full mr-3">
                        <TrendingUp className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grow Your Audience</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Connect with readers who love your genre and build a loyal following for your work.
                    </p>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="p-5 rounded-lg border border-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center mb-3">
                      <div className="bg-amber-100 dark:bg-yellow-900/30 p-2 rounded-full mr-3">
                        <Trophy className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Earn Rewards</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Get paid for your creativity through our rewards program based on readers and engagement.
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link href="/books/create">
                    <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full px-8 font-semibold text-base">
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