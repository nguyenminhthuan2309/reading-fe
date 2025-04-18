"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut, PlusCircle, BookIcon, Award, Heart, Moon, Sun, Languages } from "lucide-react";
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
import { useLanguage } from "@/lib/providers/LanguageProvider";
import * as React from "react";
import { Genre, GENRE_OPTIONS } from "@/models/genre";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, languageLabels } = useLanguage();
  
  // Use useState with useEffect for browser-only features to avoid hydration errors
  const [mounted, setMounted] = React.useState(false);
  
  // Use this effect to set mounted to true on client-side only
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
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
    <header className="bg-white text-black border-b border-gray-200 dark:bg-gray-950 dark:text-white dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center cursor-pointer">
            <BookOpen className="h-6 w-6 text-black dark:text-white mr-2" />
            <span className="font-bold text-xl">Haru's Library</span>
          </Link>
          
          <NavigationMenu className="text-black dark:text-white">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100 dark:text-white dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-white dark:focus:bg-gray-800")}>
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100 dark:text-white dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-white dark:focus:bg-gray-800">Browse</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4 w-[600px] md:w-[700px] bg-white text-black dark:bg-gray-900 dark:text-white">
                    <div className="flex gap-3">
                      {Object.entries(genreColumns).map(([category, genreList]) => (
                        <div key={category} className="flex-1">
                          <div className="text-sm font-medium mb-1 border-b pb-1 dark:border-gray-700">{category}</div>
                          <div className="flex flex-col gap-1">
                            {genreList.map((genre) => (
                              <NavigationMenuLink key={genre} asChild>
                                <Link
                                  href={`/books?filter=${genre.toLowerCase().replace(/\s+/g, '-')}`}
                                  className="text-sm hover:text-black cursor-pointer dark:hover:text-gray-300"
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
                        <div className="text-sm font-medium mb-1 border-b pb-1 dark:border-gray-700">More Genres</div>
                        <div className="flex flex-col gap-1">
                          {moreGenres.map((genre) => (
                            <NavigationMenuLink key={genre.value} asChild>
                              <Link
                                href={`/books?filter=${genre.value.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm hover:text-black cursor-pointer dark:hover:text-gray-300"
                              >
                                {genre.label}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-2 border-t text-center dark:border-gray-700">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/books"
                          className="inline-flex items-center gap-1.5 font-medium text-black hover:text-black dark:text-white dark:hover:text-gray-300"
                        >
                          View All Books
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-black bg-white hover:bg-gray-100 hover:text-black focus:bg-gray-100 dark:text-white dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-white dark:focus:bg-gray-800")}>
                  <Link href="/books/create">Create</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          <SearchDialog />
          
          {/* Dark mode toggle - disabled with Coming Soon tooltip */}
          {mounted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full cursor-not-allowed opacity-70"
                    disabled
                  >
                    <Sun className="h-4 w-4" />
                    <span className="sr-only">Dark mode - Coming Soon</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dark Mode - Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Language selector - disabled with Coming Soon tooltip */}
          {mounted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full cursor-not-allowed opacity-70"
                    disabled
                  >
                    <Languages className="h-4 w-4" />
                    <span className="sr-only">Change language - Coming Soon</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Language Selection - Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isLoggedIn && user ? (
            <HoverCard openDelay={0} closeDelay={300}>
              <HoverCardTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-offset-2" onClick={navigateToProfile}>
                  <Avatar className="h-9 w-9 transition-transform hover:scale-110">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback gender={user.gender}>
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-3" align="end" sideOffset={4} side="bottom">
                <div className="flex">
                  {/* Left side: User info */}
                  <div className="w-2/5 pr-3 border-r border-border">
                    <div className="flex flex-col items-center">
                      <Avatar className="h-14 w-14 mb-2">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback gender={user.gender}>
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="font-medium text-sm line-clamp-1">{user.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">@{username}</p>
                        <div className="flex items-center justify-center mt-1">
                          <Award className="h-4 w-4 mr-1 text-amber-500" />
                          <span className="text-xs font-semibold">{user.points || 0} Points</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Actions */}
                  <div className="w-3/5 pl-3">
                    <div className="grid grid-cols-1 gap-1.5">
                      <Link href={`/user/${user.id}`} className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      
                      <Link href="/books/my" className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                        <BookIcon className="mr-2 h-4 w-4" />
                        <span>My Books</span>
                      </Link>
                      
                      <Link href="/books/create" className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Create Book</span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-2 mt-3 flex justify-center">
                  <button 
                    className="flex items-center rounded-md px-6 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-900/20"
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