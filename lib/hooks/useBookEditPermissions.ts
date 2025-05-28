import { Book, AccessStatusEnum, ProgressStatusEnum } from "@/models/book";
import { useUserStore } from "@/lib/store";

type EditPermissions = {
  canEditBasicInfo: boolean;
  canEditExistingChapters: boolean;
  canAddNewChapters: boolean;
  canEditProgressStatus: boolean;
  canDelete: boolean;
  reasonIfDenied?: string;
};

/**
 * Hook to check if a book is editable by the current user
 * For published books, only adding new chapters is allowed
 */
export function useBookEditPermissions(book?: Book | null) {
  const { user } = useUserStore();
  
  if (!book) {
    // This is likely a new book creation (not editing), so allow full permissions
    return {
      canEditBasicInfo: true,
      canEditExistingChapters: true,
      canAddNewChapters: true,
      canEditProgressStatus: true,
      canDelete: true
    } as EditPermissions;
  }
  
  if (!user) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: false,
      canEditProgressStatus: false,
      canDelete: false,
      reasonIfDenied: "You must be logged in to edit books"
    } as EditPermissions;
  }
  
  // Check if user is the author of the book
  const isAuthor = book.author?.id === user.id;
  
  if (!isAuthor) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: false,
      canEditProgressStatus: false,
      canDelete: false,
      reasonIfDenied: "You are not the author of this book"
    } as EditPermissions;
  }
  
  // Check if book access status ID is 1 (PUBLISHED)
  if (book.accessStatus?.id === AccessStatusEnum.PUBLISHED ) {
    // For completed books, don't allow adding chapters or editing progress status
    if (book.progressStatus?.id === ProgressStatusEnum.COMPLETED) {
      return {
        canEditBasicInfo: false,
        canEditExistingChapters: false,
        canAddNewChapters: false,
        canEditProgressStatus: false,
        canDelete: false,
        reasonIfDenied: "This book is marked as completed. You cannot add new chapters or change the progress status."
      } as EditPermissions;
    }
    
    // For ongoing published books, allow adding chapters and editing progress status
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: true,
      canEditProgressStatus: true,
      canDelete: false,
      reasonIfDenied: "Published books can only have new chapters added and progress status updated"
    } as EditPermissions;
  }
  
  // For pending books, no edits allowed
  if (book.accessStatus?.id === AccessStatusEnum.PENDING) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: false,
      canEditProgressStatus: false,
      canDelete: false,
      reasonIfDenied: "Books under review cannot be edited"
    } as EditPermissions;
  }
  
  // For private books (drafts), allow all edits
  return {
    canEditBasicInfo: true,
    canEditExistingChapters: true,
    canAddNewChapters: true,
    canEditProgressStatus: true,
    canDelete: true
  } as EditPermissions;
} 