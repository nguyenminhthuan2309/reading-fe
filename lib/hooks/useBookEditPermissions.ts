import { Book, AccessStatusEnum } from "@/models/book";
import { useUserStore } from "@/lib/store";

type EditPermissions = {
  canEditBasicInfo: boolean;
  canEditExistingChapters: boolean;
  canAddNewChapters: boolean;
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
      canDelete: true
    } as EditPermissions;
  }
  
  if (!user) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: false,
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
      canDelete: false,
      reasonIfDenied: "You are not the author of this book"
    } as EditPermissions;
  }
  
  // Check if book access status ID is 1 (PUBLISHED)
  if (book.accessStatus?.id === 1 || book.accessStatus?.id === AccessStatusEnum.PUBLISHED) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: true,
      canDelete: false,
      reasonIfDenied: "Published books can only have new chapters added"
    } as EditPermissions;
  }
  
  // Check book status
  const isPending = book.accessStatus?.id === AccessStatusEnum.PENDING;
  const isPrivate = book.accessStatus?.id === AccessStatusEnum.PRIVATE;
  
  // For pending books, no edits allowed
  if (isPending) {
    return {
      canEditBasicInfo: false,
      canEditExistingChapters: false,
      canAddNewChapters: false,
      canDelete: false,
      reasonIfDenied: "Books under review cannot be edited"
    } as EditPermissions;
  }
  
  // For private books (drafts), allow all edits
  return {
    canEditBasicInfo: true,
    canEditExistingChapters: true,
    canAddNewChapters: true,
    canDelete: true
  } as EditPermissions;
} 