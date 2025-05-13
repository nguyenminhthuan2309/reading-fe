
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a notification timestamp to a human-readable format
 */
export function formatNotificationTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return format(date, 'MMM d, yyyy');
}

// Generate a username from email if no username exists
export const generateUsername = (email: string, name: string): string => {
  if (!email) return name || 'User';
  
  // Get username from email (part before @)
  const username = email.split('@')[0];
  
  // Make it look nicer
  return username
    .replace(/[0-9]/g, '')  // Remove numbers
    .replace(/[._-]/g, '')  // Remove common email separators
    .toLowerCase();
}

export function extractChapterContent(content: string): string {
 
    let result = "";
  
    const walk = (node: any) => {
      if (node.type === "text" && node.text) {
        result += node.text + " ";
      }
      if (node.content) {
        node.content.forEach((child: any) => walk(child));
      }
    };
  
    const json = JSON.parse(content);
    console.log(json);
    json.content.forEach((node: any) => walk(node));

    return result.trim();
  
}

export const toCurrentTimezone = (date: string) => {
  const dateObj = new Date(date);
  const offset = dateObj.getTimezoneOffset();
  const localDate = new Date(dateObj.getTime() - offset * 60000);
  return localDate.toISOString();
}
