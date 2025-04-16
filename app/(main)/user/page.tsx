"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { currentUser } from "@/lib/mock-user";

export default function UserRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // In a real app, this would get the current authenticated user's ID
    // For now, redirect to our mock user's profile
    router.push(`/user/${currentUser.id}`);
  }, [router]);
  
  // Show a simple loading state while redirecting
  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center">
      <p>Redirecting to your profile...</p>
    </div>
  );
} 