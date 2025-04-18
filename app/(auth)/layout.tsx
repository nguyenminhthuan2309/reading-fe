import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-h-[90vh] flex flex-col bg-transparent">
      {/* Simple header with just the logo */}
      <header className="w-full border-b border-border/50 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center cursor-pointer">
            <BookOpen className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-xl">Haru's Library</span>
          </Link>
        </div>
      </header>
      
      {/* Main content - removed the card container */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        {children}
      </div>
    </div>
  );
} 