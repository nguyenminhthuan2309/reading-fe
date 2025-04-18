"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Define a set of pleasant background colors for avatars
export const AVATAR_COLORS = [
  "bg-red-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-green-500",
  "bg-lime-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-amber-500",
];

// Get a consistent color based on name
export function getNameColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  
  // Use the first character's code point for consistent coloring
  const charCode = name.charCodeAt(0);
  const colorIndex = charCode % AVATAR_COLORS.length;
  
  return AVATAR_COLORS[colorIndex];
}


const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { gender?: string }
>(({ className, gender, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { gender?: string }
>(({ className, gender, ...props }, ref) => {
  
  
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <Image src="/images/male.png" alt="Male Avatar" width={24} height={24} />
    </AvatarPrimitive.Fallback>
  );
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback } 