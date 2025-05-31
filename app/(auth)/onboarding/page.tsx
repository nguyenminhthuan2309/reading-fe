"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {  Check } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateUserFavorites } from "@/lib/api/user";
import { useUserStore } from "@/lib/store";
import { getGenres } from "@/lib/api/books";
import { useRouter } from "next/navigation";
import { CATEGORY_KEYS } from "@/lib/constants/query-keys";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  
  const toggleGenre = (genre: number) => {
    setSelectedGenres(prevSelected => 
      prevSelected.includes(genre)
        ? prevSelected.filter(g => g !== genre)
        : [...prevSelected, genre]
    );
  };

  // Update preferences mutation
  const { mutate: updateUserFavoritesGenres, isPending: isUpdatingPreferences } = useMutation({
    mutationFn: async (genres: number[]) => {
      const response = await updateUserFavorites({userId: user?.id, categories: genres});
      return response.data;
    }
  });

  // Get categories query
  const { data: categories } = useQuery({
    queryKey: CATEGORY_KEYS.CATEGORIES,
    queryFn: async () => {
      const response = await getGenres();
      return response.data;
    }
  });

  const handleContinue = async () => {
    try {
      await updateUserFavoritesGenres(selectedGenres);
      router.push('/');
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    }
  };
  
  return (
    <div className="max-h-[90vh] flex flex-col dark:bg-gray-950">

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">Welcome to Haru's Library!</h1>
          <p className="text-muted-foreground dark:text-gray-300 text-lg">
            Select genres you enjoy to personalize your reading experience
          </p>
          {user && (
            <p className="mt-2 text-primary dark:text-red-400">
              Hello, {user.name}! Let's customize your experience.
            </p>
          )}
        </div>
        
        {/* Genre container with responsive width */}
        <div className="mx-auto w-full md:w-[70%] lg:w-1/2">
          <div className="bg-card dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl p-5 shadow-sm dark:shadow-gray-900/20">
            <div className="flex flex-wrap gap-2">
              {categories?.map(genre => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full transition-all ${
                      isSelected 
                        ? 'bg-primary dark:bg-red-600 text-primary-foreground dark:text-white' 
                        : 'bg-secondary dark:bg-gray-700 text-secondary-foreground dark:text-gray-200 hover:bg-secondary/80 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isSelected && <Check size={14} className="mr-1" />}
                    <span className="text-sm font-medium">{genre.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button variant="link" className="dark:text-gray-400 dark:hover:text-red-400">
              Skip
            </Button>
          </Link>
          
          <Button 
            onClick={handleContinue} 
            disabled={isUpdatingPreferences || selectedGenres.length === 0}
            className="dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
          >
            {isUpdatingPreferences 
              ? "Saving..." 
              : `Continue${selectedGenres.length > 0 ? ` (${selectedGenres.length} selected)` : ''}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
} 