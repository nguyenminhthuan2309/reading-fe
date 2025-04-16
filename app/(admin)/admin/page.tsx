"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();

  // Redirect to books page by default
  useEffect(() => {
    router.push("/admin/books");
  }, [router]);

  // This page will only show briefly before redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
      <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Manage your online reading platform and track reader engagement.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <Button
          onClick={() => router.push("/admin/books")}
          className="h-24 flex flex-col items-center justify-center space-y-2"
          variant="outline"
        >
          <BookOpenText className="h-8 w-8" />
          <span>Book Management</span>
        </Button>
        
        <Button
          onClick={() => router.push("/admin/analytics")}
          className="h-24 flex flex-col items-center justify-center space-y-2"
          variant="outline"
        >
          <BarChart3 className="h-8 w-8" />
          <span>Analytics</span>
        </Button>
      </div>
    </div>
  );
} 