import { useQuery } from '@tanstack/react-query';
import { DEFAULT_GENRES, GENRE_GROUP_NAMES_MAPING, GENRE_GROUPS } from '@/models/genre';
import { getGenres } from '@/lib/api/books';
import { Category } from '@/models';
import { useMemo } from 'react';

// Define an interface for category grouping
export interface GenreGroup {
  name: string;
  genres: Category[];
}

// Keys for React Query
export const GENRE_KEYS = {
  all: ['genres'] as const,
};

export const useGenres = (staleTime: number = 24 * 60 * 60 * 1000) => {
  const {
    data: genres = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: GENRE_KEYS.all,
    queryFn: async () => {
      try {
        // Fetch genres from API
        const response = await getGenres();
        
        if (response.status !== 200) {
          throw new Error(response.msg || 'Failed to fetch genres');
        }
        
        return response.data as Category[];
      } catch (error) {
        return DEFAULT_GENRES
      }
    },
    // Keep the data fresh but don't refetch too often
    staleTime,
  });

  const genreGroups = useMemo(() => {
    const groupedGenres = genres.reduce((acc, genre) => {
      const group = Object.keys(GENRE_GROUPS).find((group) => GENRE_GROUPS[group as keyof typeof GENRE_GROUPS].includes(genre.name));
      if (group) {
        acc[GENRE_GROUP_NAMES_MAPING[group as keyof typeof GENRE_GROUP_NAMES_MAPING]] = [...(acc[GENRE_GROUP_NAMES_MAPING[group as keyof typeof GENRE_GROUP_NAMES_MAPING]] || []), genre];
      }
      return acc;
    }, {} as Record<string, Category[]>);

    return groupedGenres;
  }, [genres]);

  return {
    genres,
    genreGroups,
    isLoading,
    error,
  };
}; 