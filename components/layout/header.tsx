"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut, PlusCircle, BookIcon, Award, Heart } from "lucide-react";
import { SearchDialog } from "@/components/search/search-dialog";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import * as React from "react";
import { Genre, GENRE_OPTIONS } from "@/models/genre";
import { useQueryClient } from "@tanstack/react-query";

// Define genre categories with typed Genre arrays
const genreColumns: Record<string, Genre[]> = {
  "Popular Genres": ["Fantasy", "Romance", "Mystery", "Adventure", "Sci-fi"],
  "Eastern": ["Wuxia", "Xianxia", "Xuanhuan", "Martial Arts", "Philosophical"],
  "Speculative": ["Supernatural", "Horror", "Time Travel", "Cyberpunk", "Magic"],
  "Contemporary": ["Drama", "Slice of Life", "School Life", "Comedy", "Crime"]
};

// Custom Link component for NavigationMenu
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

// Generate a username from email if no username exists
function generateUsername(email: string, name: string): string {
  if (!email) return name || 'User';
  
  // Get username from email (part before @)
  const username = email.split('@')[0];
  
  // Make it look nicer
  return username
    .replace(/[0-9]/g, '')  // Remove numbers
    .replace(/[._-]/g, '')  // Remove common email separators
    .toLowerCase();
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, logout: logoutStore } = useUserStore();
  
  // Get all genre names that aren't already in the genreColumns
  const moreGenres = React.useMemo(() => {
    const includedGenres = Object.values(genreColumns).flat();
    return GENRE_OPTIONS
      .filter(option => !includedGenres.includes(option.value as Genre))
      .slice(0, 5); // Take only 5 additional genres for the "More" section
  }, []);
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Handle logout directly in the component
  const handleLogout = () => {
    // Clear user from Zustand store
    logoutStore();
    // Clear user from React Query cache
    queryClient.setQueryData(['currentUser'], null);
    // Redirect to sign in page
    router.push('/signin');
  };

  // Navigate to user profile when avatar is clicked
  const navigateToProfile = () => {
    if (user?.id) {
      router.push(`/user/${user.id}`);
    }
  };

  // Generate username for display
  const username = user ? generateUsername(user.email, user.name) : '';

  return (
    <header className="bg-white text-black border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center cursor-pointer">
            <BookOpen className="h-6 w-6 text-black mr-2" />
            <span className="font-bold text-xl">Haru's Library</span>
          </Link>
          
          <NavigationMenu className="text-black">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100")}>
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100">Browse</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4 w-[600px] md:w-[700px] bg-white text-black">
                    <div className="flex gap-3">
                      {Object.entries(genreColumns).map(([category, genreList]) => (
                        <div key={category} className="flex-1">
                          <div className="text-sm font-medium mb-1 border-b pb-1">{category}</div>
                          <div className="flex flex-col gap-1">
                            {genreList.map((genre) => (
                              <NavigationMenuLink key={genre} asChild>
                                <Link
                                  href={`/books?filter=${genre.toLowerCase().replace(/\s+/g, '-')}`}
                                  className="text-sm hover:text-black cursor-pointer"
                                >
                                  {genre}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* More Genres column */}
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1 border-b pb-1">More Genres</div>
                        <div className="flex flex-col gap-1">
                          {moreGenres.map((genre) => (
                            <NavigationMenuLink key={genre.value} asChild>
                              <Link
                                href={`/books?filter=${genre.value.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm hover:text-black cursor-pointer"
                              >
                                {genre.label}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-2 border-t text-center">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/books"
                          className="inline-flex items-center gap-1.5 font-medium text-black hover:text-black"
                        >
                          View All Books
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100")}>
                  <Link href="/collections">Collections</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <SearchDialog />
          
          {isLoggedIn && user ? (
            <HoverCard openDelay={0} closeDelay={300}>
              <HoverCardTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-offset-2" onClick={navigateToProfile}>
                  <Avatar className="h-9 w-9 transition-transform hover:scale-110">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" align="center" sideOffset={4} side="bottom">
                <div className="flex items-center gap-4 p-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{user.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">@{username}</p>
                    <div className="flex items-center mt-1 text-xs">
                      <Award className="h-3 w-3 mr-1 text-amber-500" />
                      <span className="font-semibold">{user.points || 0} Points</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border my-2 pt-2">
                  <div className="grid grid-cols-1 gap-1">
                    <Link href="/books/create" className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Create New Book</span>
                    </Link>
                    
                    <Link href={`/user/${user.id}`} className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    
                    <Link href="/books/my" className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <BookIcon className="mr-2 h-4 w-4" />
                      <span>My Books</span>
                    </Link>
                    
                    <Link href="/favorites" className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favorites</span>
                    </Link>
                  </div>
                </div>
                
                <div className="border-t border-border pt-2 mt-1">
                  <button 
                    className="flex items-center w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <Link href="/signin" className="text-black hover:text-black text-sm font-medium">
                Sign In
              </Link>
              
              <Link href="/signup" className="hidden md:block text-black hover:text-black text-sm font-medium">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 