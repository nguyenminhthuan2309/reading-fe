"use client";

import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, User, LogOut, PlusCircle, BookIcon, Settings, Moon, Sun, Award, Search } from "lucide-react";
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { UserRoleEnum } from '@/models/user';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchDialog } from "@/components/search/search-dialog";
import { generateUsername } from "@/lib/utils";
import Image from "next/image";

export function MobileMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, logout: logoutStore } = useUserStore();
  const { theme, setTheme } = useTheme();

  // Handle logout
  const handleLogout = () => {
    logoutStore();
    queryClient.setQueryData(['me'], null);
    router.push('/signin');
  };

  // Check if user has admin role
  const isAdmin = user?.role?.name === UserRoleEnum.ADMIN;
  const isManager = user?.role?.name === UserRoleEnum.MANAGER;

  // Generate username for display
  const username = user ? generateUsername(user.email, user.name) : '';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Haru's Library Logo" 
              width={24} 
              height={24} 
              className="mr-2"
            />
            <span className="font-bold text-xl">Haru's Library</span>
          </SheetTitle>
        </SheetHeader>
        
        {/* User info section at the top (if logged in) */}
        {isLoggedIn && user && (
          <div className="mb-6 flex flex-col items-center pb-4 border-b">
            <Avatar className="h-16 w-16 mb-2">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback gender={user.gender}></AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">@{username}</p>
              
              {/* Token balance */}
              <div className="flex items-center justify-center mt-2 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/30 w-fit mx-auto">
                <Award className="h-4 w-4 text-amber-500 mr-1" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{user.tokenBalance || 0} HARU</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="mb-4">
          <SearchDialog variant="mobile" />
        </div>
        
        {/* Theme Toggle */}
        <div className="mb-4 flex justify-center">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>
        </div>
        
        <div className="flex flex-col space-y-4">
          {/* Main Navigation Links */}
          <div className="flex flex-col space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">
                Home
              </Button>
            </Link>
            
            <Link href="/books">
              <Button variant="ghost" className="w-full justify-start">
                Browse Books
              </Button>
            </Link>
            
            {isLoggedIn && (
              <Link href="/books/create">
                <Button variant="ghost" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Publish Book
                </Button>
              </Link>
            )}
          </div>
          
          {/* User Section */}
          <div className="pt-4 border-t">
            {isLoggedIn ? (
              <div className="space-y-1">
                <h3 className="px-3 text-sm font-medium mb-2">Your Account</h3>
                
                <Link href="/me">
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                
                <Link href="/me?section=shelf">
                  <Button variant="ghost" className="w-full justify-start">
                    <BookIcon className="mr-2 h-4 w-4" />
                    My Books
                  </Button>
                </Link>
                
                {(isAdmin || isManager) && (
                  <Link href="/admin/books">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-medium text-amber-700"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/signin">
                  <Button variant="default" className="w-full">
                    Sign In
                  </Button>
                </Link>
                
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 