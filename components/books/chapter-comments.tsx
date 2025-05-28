"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ChevronDown, Reply, Edit, Trash, X, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  getChapterComments,
  addChapterComment,
  updateChapterComment,
  deleteChapterComment
} from "@/lib/api/books";
import { PaginatedData } from "@/models/api";
import { useUserStore } from "@/lib/store/useUserStore";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Comment } from "@/models/book";
import { COMMENT_KEYS } from "@/lib/constants/query-keys";
import { useAvailableActivities } from "@/lib/hooks/useActivities";

interface ChapterCommentsProps {
  bookId: number;
  chapterId: number;
}

export function ChapterComments({ bookId, chapterId }: ChapterCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const { user, isLoggedIn } = useUserStore();
  const router = useRouter();
  const [limit] = useState(10);
  const queryClient = useQueryClient();
  const { createActivity } = useAvailableActivities();

  // Get comments for this chapter using useInfiniteQuery for pagination
  const {
    data,
    isLoading,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: COMMENT_KEYS.CHAPTER_COMMENTS(chapterId),
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const response = await getChapterComments({
          chapterId,
          page: pageParam,
          limit
        });
        return response.data as PaginatedData<Comment>;
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage: PaginatedData<Comment>, allPages: PaginatedData<Comment>[]) => {
      return allPages.length < lastPage.totalPages
        ? allPages.length + 1
        : undefined;
    },
    initialPageParam: 1
  });

  // Get replies for specific comments
  const getReplies = (commentId: number) => {
    return useQuery({
      queryKey: COMMENT_KEYS.COMMENT_REPLIES(commentId),
      queryFn: async () => {
        try {
          const response = await getChapterComments({
            chapterId,
            commentId,
            limit: 100, // Use a higher limit for replies
            page: 1
          });
          return response.data.data as Comment[];
        } catch (error) {
          console.error("Error fetching replies:", error);
          throw error;
        }
      },
      enabled: expandedComments.includes(commentId)
    });
  };

  // Get the flattened comments from all pages
  const comments = data?.pages.flatMap(page => page.data) || [];

  // Add a new comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ comment, parentId }: { comment: string, parentId?: number }) => {
      return await addChapterComment(chapterId, comment, parentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.CHAPTER_COMMENTS(chapterId) });
      // Also invalidate replies query for the parent comment if it exists
      if (replyingTo) {
        queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.COMMENT_REPLIES(replyingTo.id) });
      }

      // Create activity if vip user
      if (user?.isVip) {
        createActivity({
          activityType: 'comment_chapter',
          relatedEntityId: chapterId,
        });
      }

      setNewComment("");
      setReplyingTo(null);
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      // Keep the comment text in case of error so user doesn't lose their input
    }
  });

  // Update a comment
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, comment }: { commentId: number, comment: string }) => {
      return await updateChapterComment(commentId, comment);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.CHAPTER_COMMENTS(chapterId) });
      // Also invalidate replies query for the parent comment if it was a reply
      const editedComment = comments.find(c => c.id === variables.commentId) ||
        comments.flatMap(c => expandedComments.includes(c.id) ?
          getReplies(c.id).data || [] : []).find(c => c.id === variables.commentId);

      if (editedComment?.parentId) {
        queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.COMMENT_REPLIES(editedComment.parentId) });
      }
      setEditingComment(null);
      setEditContent("");
    }
  });

  // Delete a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await deleteChapterComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.CHAPTER_COMMENTS(chapterId) });
      // Clean up any expanded states and queries for replies
      expandedComments.forEach(id => {
        queryClient.invalidateQueries({ queryKey: COMMENT_KEYS.COMMENT_REPLIES(id) });
      });
      setCommentToDelete(null);
      setShowDeleteDialog(false);
    }
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      comment: newComment,
      parentId: replyingTo?.id
    });
  };

  const handleUpdateComment = () => {
    if (!editingComment || !editContent.trim()) return;

    updateCommentMutation.mutate({
      commentId: editingComment.id,
      comment: editContent
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, action: 'comment' | 'edit') => {
    // Submit on Enter without Shift key (Shift+Enter creates a new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'comment') {
        handleSubmitComment();
      } else if (action === 'edit') {
        handleUpdateComment();
      }
    }
  };

  const handleDeleteComment = () => {
    if (!commentToDelete) return;

    deleteCommentMutation.mutate(commentToDelete);
  };

  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setEditingComment(null);
    // Also expand replies if this comment has replies and isn't already expanded
    if (comment.totalChildComments && comment.totalChildComments > 0 && !expandedComments.includes(comment.id)) {
      setExpandedComments(prev => [...prev, comment.id]);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.comment);
    setReplyingTo(null);
  };

  const confirmDelete = (commentId: number) => {
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };

  const cancelAction = () => {
    setReplyingTo(null);
    setEditingComment(null);
    setEditContent("");
  };

  const handleSignIn = () => {
    router.push('/signin?redirect=' + encodeURIComponent(window.location.pathname));
  };

  const loadMoreComments = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const toggleReplies = (commentId: number) => {
    setExpandedComments(prev =>
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  const canModifyComment = (comment: Comment) => {
    if (!isLoggedIn || !user) return false;
    return String(user.id) === String(comment.user.id);
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`border rounded-md p-2 space-y-1 ${isReply ? 'ml-6 mt-1 border-l-2 border-l-primary/20' : ''}`}>
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
          <AvatarFallback>{comment.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium">{comment.user.name}</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {editingComment?.id === comment.id ? (
            <div className="mt-1">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="resize-none mb-1"
                rows={4}
                onKeyDown={(e) => handleKeyDown(e, 'edit')}
              />
              <div className="flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelAction}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateComment}
                  disabled={!editContent.trim() || updateCommentMutation.isPending}
                  className="h-7 px-2 text-xs"
                >
                  Update
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs mt-1">{comment.comment}</p>
          )}
        </div>
      </div>

      {editingComment?.id !== comment.id && (
        <div className="flex items-center justify-end gap-1">
          {canModifyComment(comment) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-1 text-muted-foreground"
                onClick={() => startEdit(comment)}
              >
                Edit
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-1 text-muted-foreground"
                onClick={() => confirmDelete(comment.id)}
              >
                Delete
              </Button>
            </>
          )}

          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-1 text-muted-foreground"
              onClick={() => startReply(comment)}
            >
              Reply
            </Button>
          )}



          {(!isReply && comment.totalChildComments && comment.totalChildComments > 0) ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-1 text-muted-foreground"
              onClick={() => toggleReplies(comment.id)}
            >
              {expandedComments.includes(comment.id) ? (
                <>
                  <ChevronUp className="h-2.5 w-2.5 mr-1" />
                  Hide replies
                </>
              ) : (
                <span className="text-muted-foreground text-[10px]">
                  {comment.totalChildComments} {comment.totalChildComments === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </Button>
          ) : null}
        </div>
      )}

      {replyingTo?.id === comment.id && (
        <div className="mt-2 pl-6 border-l border-accent">
          <div className="flex gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  Replying to <span className="font-medium">{comment.user.name}</span>
                </span>
              </div>
              <Textarea
                placeholder="Write a reply..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none"
                rows={4}
                onKeyDown={(e) => handleKeyDown(e, 'comment')}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelAction}
                  className="h-7 px-2 text-xs mr-2"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="flex items-center gap-1 h-7 px-2 text-xs"
                >
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show replies if expanded */}
      {!isReply && expandedComments.includes(comment.id) && (
        <div className="mt-1">
          <RepliesList commentId={comment.id} chapterId={chapterId} getReplies={getReplies} />
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-center text-destructive text-sm">
        Error loading comments. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Comments list in a scrollable container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 mb-4">
        {comments && comments.length > 0 ? (
          <>
            {comments.map(comment => renderComment(comment))}

            {hasNextPage && (
              <Button
                variant="ghost"
                className="w-full text-primary text-xs py-1 h-auto"
                onClick={loadMoreComments}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  "Loading more..."
                ) : (
                  <>
                    Load more <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      {/* Comment form - sticky at bottom */}
      <div className="sticky bottom-0 bg-background pt-2 border-t">
        {isLoggedIn ? (
          <div>
            {/* Only show the main comment form if not currently replying or editing */}
            {!replyingTo && !editingComment && (
              <div className="flex gap-2">
                <Avatar className="h-7 w-7 mt-1">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{user?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={4}
                    onKeyDown={(e) => handleKeyDown(e, 'comment')}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="h-7 px-2 text-xs"
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground mb-2">Sign in to leave a comment</p>
            <Button size="sm" onClick={handleSignIn}>Sign In</Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Make the RepliesList component more compact too
function RepliesList({
  commentId,
  chapterId,
  getReplies
}: {
  commentId: number;
  chapterId: number;
  getReplies: (commentId: number) => any;
}) {
  const { data: replies, isLoading, error } = getReplies(commentId);

  if (isLoading) {
    return (
      <div className="ml-6 space-y-1 py-1">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-6 p-1 text-center text-xs text-destructive">
        Error loading replies.
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="ml-6 p-1 text-center text-xs text-muted-foreground">
        No replies yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {replies.map((reply: Comment) => (
        <div key={reply.id} className="ml-6 border rounded-md p-2 border-l-2 border-l-primary/20">
          <div className="flex items-start gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={reply.user.avatar} alt={reply.user.name} />
              <AvatarFallback>{reply.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium">{reply.user.name}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </span>
              </div>

              <p className="text-xs mt-1">{reply.comment}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 