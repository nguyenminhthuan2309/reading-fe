import { get, post, put, del } from '../api';
import { ApiResponse } from '@/models/api';

/**
 * Get comments for a specific chapter
 */
export async function getChapterComments(bookId: number, chapterId: number): Promise<ApiResponse<any[]>> {
  try {
    return await get<any[]>(`/book/${bookId}/chapter/${chapterId}/comments`);
  } catch (error) {
    // For development: temporarily return mock data if API endpoint doesn't exist yet
    console.warn("Using mock comment data - implement actual API endpoint");
    return {
      success: false,
      status: 200,
      code: 200,
      msg: "Success",
      data: getMockComments()
    };
  }
}

/**
 * Add a comment to a chapter
 */
export async function addChapterComment(bookId: number, chapterId: number, content: string): Promise<ApiResponse<any>> {
  try {
    return await post<any>(`/book/${bookId}/chapter/${chapterId}/comments`, { content });
  } catch (error) {
    // For development: temporarily return success if API endpoint doesn't exist yet
    console.warn("Mock comment added - implement actual API endpoint");
    return {
      success: false,
      status: 200,
      code: 200,
      msg: "Comment added successfully",
      data: {}
    };
  }
}

/**
 * Like a comment
 */
export async function likeComment(commentId: number): Promise<ApiResponse<any>> {
  try {
    return await post<any>(`/comment/${commentId}/like`, {});
  } catch (error) {
    // For development: temporarily return success if API endpoint doesn't exist yet
    console.warn("Mock like added - implement actual API endpoint");
    return {
      success: false,
      status: 200,
      code: 200,
      msg: "Comment liked successfully",
      data: {}
    };
  }
}

/**
 * Unlike a comment
 */
export async function unlikeComment(commentId: number): Promise<ApiResponse<any>> {
  try {
    return await del<any>(`/comment/${commentId}/like`);
  } catch (error) {
    // For development: temporarily return success if API endpoint doesn't exist yet
    console.warn("Mock like removed - implement actual API endpoint");
    return {
      success: false,
      status: 200,
      code: 200,
      msg: "Comment unliked successfully",
      data: {}
    };
  }
}

// Mock data for development
function getMockComments() {
  return [
    {
      id: 1,
      content: "This chapter was amazing! The character development is fantastic.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      likes: 5,
      isLiked: Math.random() > 0.5,
      user: {
        id: 101,
        name: "Jane Reader",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane"
      }
    },
    {
      id: 2,
      content: "I didn't expect that plot twist! Can't wait for the next chapter.",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      likes: 12,
      isLiked: Math.random() > 0.5,
      user: {
        id: 102,
        name: "Book Lover",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=BookLover"
      }
    },
    {
      id: 3,
      content: "The writing style is really engaging. I couldn't stop reading!",
      createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
      likes: 8,
      isLiked: Math.random() > 0.5,
      user: {
        id: 103,
        name: "Novel Fan",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NovelFan"
      }
    }
  ];
} 