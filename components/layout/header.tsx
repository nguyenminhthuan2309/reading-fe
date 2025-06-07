"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut, PlusCircle, BookIcon, Award, Sun, Languages, Settings, Bell, X, Check, Moon, CheckSquare, Loader2, ChevronDown, Target, Search, Plus, ArrowUpCircle } from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useConditionalAnalytics, useSocket } from '@/lib/hooks';
import { useGenres } from "@/lib/hooks/useGenres";
import Image from "next/image";

import { MobileMenu } from "./mobile-menu";
import { useAvailableActivities } from "@/lib/hooks/useActivities";
import { useEffect } from "react";
import { ANALYTICS_STORAGE_KEYS } from "@/lib/utils/analytics";
import { useUserBallance } from "@/lib/hooks/useUsers";

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
  } else if (typeStr.includes('points')) {
    return <Award className="h-4 w-4 text-amber-500" />;
  } else {
    return <Bell className="h-4 w-4" />;
  }
};

export default function Header() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout: logoutStore } = useUserStore();
  const { theme, setTheme } = useTheme();
  const {  genreGroups } = useGenres();
  const pathname = usePathname();
  
  // Get analytics functions for logout cleanup
  const { clearTracking, endSession, currentVisitId, visitorId } = useConditionalAnalytics({
    enabled: false, // We don't want to track in header, just use the cleanup functions
    pathname
  });
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

  const { data: userBallance } = useUserBallance(user?.id || 0);
  
  // Initialize socket connection for notifications
  const { connected: socketConnected } = useSocket({
    autoConnect: true,
    namespace: 'notification',
    enableNotifications: true
  });

  const { 
    availableActivities, 
    isLoading: activitiesLoading, 
    notCompletedCount,
    createActivity
  } = useAvailableActivities();

  useEffect(() => {
    if (availableActivities?.length > 0) {
      const idx = availableActivities.findIndex(activity => activity.activityType === 'login' && activity.status === 'notstarted');
      if (idx !== -1) {
        createActivity({
          activityType: 'login',
        });
      }
    }
  }, [availableActivities, createActivity]);

  // Handle logout directly in the component
  const handleLogout = () => {
    // End current analytics session if exists
    if (currentVisitId) {
      endSession(currentVisitId);
    }

    if (visitorId) {
      localStorage.removeItem(ANALYTICS_STORAGE_KEYS.VISITOR_ID);
    }
    
    // Clear analytics tracking state and storage
    clearTracking();
    
    // Clear user from Zustand store (this also clears auth cookies)
    logoutStore();

    // Clear user from React Query cache
    queryClient.clear();
    
    // Redirect to sign in page
    router.push('/signin');
  };

  // Navigate to user profile when avatar is clicked
  const navigateToProfile = () => {
    if (user?.id) {
      router.push(`/me`);
    }
  };

  // Handle deposit navigation
  const navigateToDeposit = () => {
    router.push('/deposit');
  };

  // Generate username for display
  const username = user ? generateUsername(user.email, user.name) : '';

  // Check if user has admin role
  const isAdmin = user?.role?.name === UserRoleEnum.ADMIN;
  const isManager = user?.role?.name === UserRoleEnum.MANAGER;

  return (
    <header className="bg-white text-black border-b border-gray-200 dark:bg-gray-950 dark:text-white dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <Link href="/" className="flex items-center cursor-pointer ml-0 md:ml-0">
              <Image 
                src="/logo.png" 
                alt="Haru's Library Logo" 
                width={64} 
                height={64} 
                className="mr-2"
              />
              <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">Haru's Library</span>
            </Link>
          </div>
          
          <NavigationMenu className="text-black dark:text-white hidden md:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "text-black bg-white hover:bg-amber-100 hover:text-yellow-700 focus:bg-amber-100 dark:text-white dark:bg-gray-950 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400 dark:focus:bg-yellow-900/20")}>
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-black bg-white hover:bg-amber-100 hover:text-yellow-700 focus:bg-amber-100 dark:text-white dark:bg-gray-950 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400 dark:focus:bg-yellow-900/20">Genres</NavigationMenuTrigger>
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
                                  href={`/books?genres=${genre.name.replace(/\s+/g, '+')}&page=1`}
                                  className="text-sm hover:text-yellow-700 cursor-pointer dark:hover:text-yellow-400"
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
                          className="inline-flex items-center gap-1.5 font-medium text-black hover:text-yellow-700 dark:text-white dark:hover:text-yellow-400"
                        >
                          View All Books
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search - hide on mobile */}
          <div className="hidden md:block">
            <SearchDialog variant="default" />
          </div>
          
          {/* Haru balance & missions combined - hide on mobile */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <div className="hidden md:flex md:relative items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 dark:border-amber-700/50 cursor-pointer hover:shadow-sm hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-800/30 dark:hover:to-amber-700/20 transition-all duration-200 group">
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
                    <Award className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-300 dark:to-amber-400">{userBallance?.tokenBalance || 0}</span>
                  <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "absolute inset-0 rounded-full",
                      notCompletedCount > 0 && "before:content-[''] before:absolute before:inset-0 before:rounded-full before:bg-amber-400/30 before:animate-radar after:content-[''] after:absolute after:inset-0 after:rounded-full after:bg-amber-500/20 after:animate-radar after:animation-delay-500"
                    )}></div>
                    <div className="flex items-center justify-center h-4 w-4 rounded-full bg-amber-200 text-amber-700 dark:bg-amber-700/50 dark:text-amber-300 group-hover:bg-amber-300 dark:group-hover:bg-amber-600 transition-colors z-10">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 rounded-lg border shadow-lg">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-amber-700 dark:text-amber-300">Your Balance</span>
                        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-300 dark:to-amber-400">
                          {user?.tokenBalance || 0}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white/70 backdrop-blur-sm border-amber-200 hover:bg-amber-100 transition-all duration-200 shadow-sm"
                      title="Deposit Haru"
                      onClick={navigateToDeposit}
                    >
                      <ArrowUpCircle className="h-4 w-4 text-amber-600" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {activitiesLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="h-5 w-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                    </div>
                  ) : availableActivities && availableActivities.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-amber-500" />
                          Available Missions
                        </h4>
                        {notCompletedCount > 0 && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/50">
                            {notCompletedCount} pending
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-200 dark:scrollbar-thumb-amber-900/50">
                        {availableActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/50">
                                <Target className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="text-xs font-medium">{activity.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" 
                                  style={{ width: `${(activity.completedCount / activity.maxPerDay) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">{activity.completedCount}/{activity.maxPerDay}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-500" />
                        How to earn Haru tokens
                      </h4>
                      <ul className="space-y-2">
                        {[
                          { icon: <Target className="h-3.5 w-3.5 text-amber-500" />, text: "Complete missions and challenges" },
                          { icon: <BookOpen className="h-3.5 w-3.5 text-amber-500" />, text: "Create and publish books" },
                          { icon: <User className="h-3.5 w-3.5 text-amber-500" />, text: "Interact with the community" }
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs text-muted-foreground">
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/50">
                              {item.icon}
                            </div>
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-amber-700 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 dark:from-amber-900/20 dark:to-amber-800/10 dark:border-amber-700/50 dark:text-amber-400 dark:hover:from-amber-800/30 dark:hover:to-amber-700/20 shadow-sm"
                      onClick={navigateToDeposit}
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-amber-700 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 dark:from-amber-900/20 dark:to-amber-800/10 dark:border-amber-700/50 dark:text-amber-400 dark:hover:from-amber-800/30 dark:hover:to-amber-700/20 shadow-sm"
                      onClick={() => router.push('/me?section=missions')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      All Missions
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Theme Toggle - hide on mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Auth section - normal display for desktop, hide sign in on mobile */}
          { user ? (
            <div className="hidden md:flex items-center gap-3">
              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full flex items-center justify-center">
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
                <PopoverContent align="end" className="w-80 p-0 rounded-lg border shadow-lg">
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 p-4 border-b rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-amber-700 dark:text-amber-300">Notifications</h4>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="icon" onClick={handleMarkAllAsRead} className="h-8 w-8 rounded-full bg-white/70 backdrop-blur-sm border-amber-200 hover:bg-amber-100 transition-all duration-200 shadow-sm" title="Mark all as read">
                          <CheckSquare className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto pb-4">
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
                              "flex items-center justify-between text-sm py-2 px-3 rounded-md bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 shadow-sm my-1.5",
                              !notification.isRead && "border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn(
                                "flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0",
                                !notification.isRead 
                                  ? "bg-amber-100 dark:bg-amber-900/50" 
                                  : "bg-gray-100 dark:bg-gray-700/50"
                              )}>
                                {React.cloneElement(getNotificationIcon(notification.type), {
                                  className: cn(
                                    "h-3 w-3",
                                    !notification.isRead 
                                      ? "text-amber-600 dark:text-amber-400" 
                                      : "text-gray-500 dark:text-gray-400"
                                  )
                                })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-medium line-clamp-1 flex-1">{notification.title}</p>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatNotificationTime(notification.createdAt)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notification.message}</p>
                              </div>
                            </div>
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-2 rounded-full bg-white/70 hover:bg-amber-100 border-amber-200 transition-all duration-200 shadow-sm flex-shrink-0"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3 text-amber-600" />
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
                  </div>
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

                        {(isAdmin || isManager) && (
                          <Link 
                            href="/admin/books" 
                            className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Management</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 mt-3 flex justify-center">
                    <button 
                      className="flex items-center rounded-md px-6 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors dark:hover:bg-yellow-900/20"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          ) : (
            <>
              <Link href="/signin" className="hidden md:block text-black hover:text-yellow-700 dark:hover:text-yellow-400 text-sm font-medium">
                Sign In
              </Link>
              
              <Link href="/signup" className="hidden md:block text-black hover:text-yellow-700 dark:hover:text-yellow-400 text-sm font-medium">
                Sign Up
              </Link>
            </>
          )}
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes radar {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-radar {
          animation: radar 2s infinite;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </header>
  );
} 