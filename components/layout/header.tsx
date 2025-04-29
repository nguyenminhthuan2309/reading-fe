"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut, PlusCircle, BookIcon, Award, Sun, Languages, Settings, Bell, X, Check, Moon, CheckSquare, Loader2, ChevronDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatNotificationTime, generateUsername } from "@/lib/utils";
import { useUserStore } from "@/lib/store";
import { useLanguage } from "@/lib/providers/LanguageProvider";
import * as React from "react";
import { Genre } from "@/models/genre";
import { UserRoleEnum } from "@/models/user";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useSocket } from '@/lib/hooks';
import { useGenres } from "@/lib/hooks/useGenres";

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

// Get notification icon based on type
export const getNotificationIcon = (type: any) => {
  // Use a simple approach based on the type string to avoid type issues
  const typeStr = String(type).toLowerCase();
  
  if (typeStr.includes('comment') || typeStr.includes('reply') || typeStr.includes('message')) {
    return <Bell className="h-4 w-4 text-blue-500" />;
  } else if (typeStr.includes('mention') || typeStr.includes('user')) {
    return <User className="h-4 w-4 text-green-500" />;
  } else if (typeStr.includes('book') || typeStr.includes('chapter')) {
    return <BookIcon className="h-4 w-4 text-purple-500" />;
  } else if (typeStr.includes('tx') || typeStr.includes('system')) {
    return <Settings className="h-4 w-4 text-gray-500" />;
  } else {
    return <Bell className="h-4 w-4" />;
  }
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, logout: logoutStore } = useUserStore();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, languageLabels } = useLanguage();
  
  const { genres, genreGroups, isLoading: isLoadingGenres } = useGenres();
  
  // Use our custom notifications hook
  const { 
    notifications, 
    unreadCount, 
    isLoading: isLoadingNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleClearNotifications,
    hasMoreNotifications,
    isFetchingMore,
    handleLoadMore,
  } = useNotifications();
  
  // Initialize socket connection for notifications
  const { connected: socketConnected } = useSocket({
    autoConnect: true,
    namespace: 'notification',
    enableNotifications: true
  });

  // Handle logout directly in the component
  const handleLogout = () => {
    // Clear user from Zustand store
    logoutStore();
    // Clear user from React Query cache
    queryClient.setQueryData(['me'], null);
    // Redirect to sign in page
    router.push('/signin');
  };

  // Navigate to user profile when avatar is clicked
  const navigateToProfile = () => {
    if (user?.id) {
      router.push(`/me`);
    }
  };

  // Generate username for display
  const username = user ? generateUsername(user.email, user.name) : '';

  // Check if user has admin role
  const isAdmin = user?.role?.name === UserRoleEnum.ADMIN;

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
                  <div className="p-4 w-[600px] md:w-[1000px] bg-white text-black dark:bg-gray-900 dark:text-white">
                    <div className="flex gap-3">
                      {Object.entries(genreGroups).map(([name, genres]) => (
                        <div key={name} className="flex-1">
                          <div className="text-sm font-medium mb-1 border-b pb-1 dark:border-gray-700">{name}</div>
                          <div className="flex flex-col gap-1">
                            {genres.map((genre) => (
                              <NavigationMenuLink key={genre.id} asChild>
                                <Link
                                  href={`/books?filter=${genre.name.toLowerCase().replace(/\s+/g, '-')}`}
                                  className="text-sm hover:text-black cursor-pointer dark:hover:text-gray-300"
                                >
                                  {genre.name}
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      ))}
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
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Language Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-9 px-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                aria-label="Change language"
              >
                <span className="text-base">🇺🇸</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-0 rounded-lg border shadow-md">
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">SELECT LANGUAGE</div>
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start font-normal text-sm rounded-md bg-gray-100/50 dark:bg-gray-800/50"
                  >
                    <span className="w-6 flex justify-center mr-2 text-base">🇺🇸</span> English
                    <Check className="ml-auto h-4 w-4 opacity-100" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start font-normal text-sm rounded-md"
                  >
                    <span className="w-6 flex justify-center mr-2 text-base">🇻🇳</span> Tiếng Việt
                    <Check className="ml-auto h-4 w-4 opacity-0" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {isLoggedIn && user ? (
            <>
              {/* Add Haru balance display */}
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/30">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{user.tokenBalance || 0}</span>
              </div>
              
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 max-h-[400px] overflow-auto rounded-lg border shadow-md">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h4 className="font-medium">Notifications</h4>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="icon" onClick={handleMarkAllAsRead} className="h-8 w-8 rounded-full" title="Mark all as read">
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {isLoadingNotifications ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>Loading notifications...</p>
                    </div>
                  ) : notifications?.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y p-2">
                      {notifications?.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={cn(
                            "p-3 hover:bg-muted flex items-start gap-3 group rounded-md my-1",
                            !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                          )}
                        >
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <span className="text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 rounded-full"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {/* Load More Button */}
                      {hasMoreNotifications && (
                        <div className="pt-2 pb-1 flex justify-center">
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                            onClick={handleLoadMore}
                            disabled={isFetchingMore}
                          >
                            {isFetchingMore ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Load more
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              
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
                            <span className="text-xs font-semibold">{user.tokenBalance || 0} Haru</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Actions */}
                    <div className="w-3/5 pl-3">
                      <div className="grid grid-cols-1 gap-1.5">
                        <Link href={`/me`} className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        
                        <Link href={`/me?section=shelf`} className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                          <BookIcon className="mr-2 h-4 w-4" />
                          <span>My Books</span>
                        </Link>
                        
                        <Link href="/books/create" className="flex items-center rounded-md px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>Publish Book</span>
                        </Link>

                        {isAdmin && (
                          <Link 
                            href="/admin/books" 
                            className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        )}
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
            </>
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