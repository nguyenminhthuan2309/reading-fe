"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GENRE_OPTIONS } from "@/models/genre";
import { BookOpen, Check } from "lucide-react";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { updatePreferences, isUpdatingPreferences, user } = useAuth();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  const toggleGenre = (genre: string) => {
    setSelectedGenres(prevSelected => 
      prevSelected.includes(genre)
        ? prevSelected.filter(g => g !== genre)
        : [...prevSelected, genre]
    );
  };
  
  const handleContinue = async () => {
    try {
      await updatePreferences(selectedGenres);
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update preferences");
    }
  };
  
  return (
    <div className="max-h-[90vh] flex flex-col">

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Welcome to Haru's Library!</h1>
          <p className="text-muted-foreground text-lg">
            Select genres you enjoy to personalize your reading experience
          </p>
          {user && (
            <p className="mt-2 text-primary">
              Hello, {user.name}! Let's customize your experience.
            </p>
          )}
        </div>
        
        {/* Genre container with responsive width */}
        <div className="mx-auto w-full md:w-[70%] lg:w-1/2">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map(genre => {
                const isSelected = selectedGenres.includes(genre.value);
                return (
                  <button
                    key={genre.value}
                    onClick={() => toggleGenre(genre.value)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {isSelected && <Check size={14} className="mr-1" />}
                    <span className="text-sm font-medium">{genre.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button variant="link">
              Skip
            </Button>
          </Link>
          
          <Button 
            onClick={handleContinue} 
            disabled={isUpdatingPreferences || selectedGenres.length === 0}
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