"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModerationResults, ModerateButton } from "@/components/moderation";
import { useOpenAI, MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";
import { toast } from "sonner";

export interface ModerationPageProps {
  contentId?: string;
  title?: string;
  description?: string;
  chapters?: Array<{id: string | number; title: string; content: string}>;
  coverImageUrl?: string;
  onApprove?: (contentId: string) => Promise<void>;
  onReject?: (contentId: string, reason: string) => Promise<void>;
}

export default function ModerationPage({
  contentId,
  title = "",
  description = "",
  chapters = [],
  coverImageUrl,
  onApprove,
  onReject
}: ModerationPageProps) {
  const [moderationResults, setModerationResults] = useState<any | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModerationModelType>(MODERATION_MODELS.OMNI);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<'pending' | 'passed' | 'flagged' | null>(null);
  
  // Use the OpenAI hook
  const { moderateContent, isLoading: isModeratingContent } = useOpenAI();

  const handleModerateContent = async () => {
    setModerationResults(null);
    setModerationStatus('pending');
    
    try {
      // Collect chapter text content
      const chaptersContent = chapters.map((chapter) => {
        return `${chapter.title} ${chapter.content}`;
      }).join('\n\n===CHAPTER_SEPARATOR===\n\n');
      
      // Convert cover image to base64 if needed
      let coverImageBase64 = '';
      
      if (coverImageUrl) {
        try {
          const response = await fetch(coverImageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              coverImageBase64 = reader.result as string;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Error fetching and converting cover image to base64:", error);
        }
      }
      
      // Use the hook to moderate content
      const result = await moderateContent({
        title,
        description,
        chaptersContent,
        coverImage: coverImageBase64,
        chapterImages: [],
        model: selectedModel
      });
      
      if (result) {
        console.log('Moderation result:', result);
        setModerationResults(result);
        
        // Show success or warning notification based on results
        if (result.flagged) {
          setModerationStatus('flagged');
          toast.warning("Some content may violate content policies. See details in the moderation report.");
        } else {
          setModerationStatus('passed');
          toast.success("Content moderation passed with no issues detected.");
        }
        
        setModerationDialogOpen(true);
      } else {
        setModerationStatus(null);
      }
    } catch (error) {
      console.error("Error moderating content:", error);
      setModerationStatus(null);
      toast.error("Failed to run content moderation. Please try again.");
    }
  };

  const handleApprove = async () => {
    if (!contentId || !onApprove) return;
    
    try {
      await onApprove(contentId);
      toast.success("Content has been approved");
    } catch (error) {
      toast.error("Failed to approve content");
      console.error("Error approving content:", error);
    }
  };

  const handleReject = async () => {
    if (!contentId || !onReject) return;
    
    // In a real app, you might want to prompt for a reason
    const reason = "Content doesn't meet community guidelines";
    
    try {
      await onReject(contentId, reason);
      toast.success("Content has been rejected");
    } catch (error) {
      toast.error("Failed to reject content");
      console.error("Error rejecting content:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
          <CardDescription>
            Review content for compliance with community guidelines
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            
            {description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1 text-muted-foreground">Description:</h4>
                <p className="text-sm">{description}</p>
              </div>
            )}
            
            {chapters.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Chapters ({chapters.length}):
                </h4>
                <ul className="space-y-2">
                  {chapters.slice(0, 3).map((chapter, index) => (
                    <li key={chapter.id} className="text-sm">
                      <span className="font-medium">{chapter.title}</span>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {chapter.content.substring(0, 150)}...
                      </p>
                    </li>
                  ))}
                  {chapters.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      + {chapters.length - 3} more chapters
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {coverImageUrl && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Cover Image:</h4>
                <img 
                  src={coverImageUrl} 
                  alt="Book cover" 
                  className="w-24 h-32 object-cover rounded border"
                />
              </div>
            )}
          </div>
          
          {/* Moderation Status */}
          {moderationStatus && (
            <div 
              className={`p-3 rounded-md text-sm ${
                moderationStatus === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                moderationStatus === 'passed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {moderationStatus === 'pending' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : moderationStatus === 'passed' ? (
                  <span>✓ Content passed moderation checks</span>
                ) : (
                  <span>⚠ Content flagged for review</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="flex-1 flex gap-2">
            <ModerateButton
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
              onModerate={handleModerateContent}
              isLoading={isModeratingContent}
            />
            
            {moderationResults && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setModerationDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                View Results
              </Button>
            )}
          </div>
          
          {onApprove && onReject && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReject}
                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Moderation Results Dialog */}
      <ModerationResults
        open={moderationDialogOpen}
        onOpenChange={setModerationDialogOpen}
        results={moderationResults}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onRecheck={handleModerateContent}
        isLoading={isModeratingContent}
      />
    </div>
  );
} 