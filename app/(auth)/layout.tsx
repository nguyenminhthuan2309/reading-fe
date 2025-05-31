import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-h-[90vh] flex flex-col bg-transparent dark:bg-gray-950 min-h-screen">
      {/* Simple header with just the logo */}
      <header className="w-full border-b border-border/50 dark:border-gray-700/50 backdrop-blur-sm py-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center cursor-pointer">
            <Image 
              src="/logo.png" 
              alt="Haru's Library Logo" 
              width={24} 
              height={24} 
              className="mr-2"
            />
            <span className="font-bold text-xl dark:text-white">Haru's Library</span>
          </Link>
        </div>
      </header>
      
      {/* Main content with gradient background */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        {children}
      </div>
    </div>
  );
} 