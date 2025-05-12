import React from "react";
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
import { Button } from "@/components/ui/button";
import { Chapter } from "@/models/book";
import { ArrowRight, BookOpen, Coins, Loader2, ShoppingCart, Wallet } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { usePurchaseChapter } from "@/lib/hooks/usePurchase";
import { useRouter } from "next/navigation";

interface PurchaseChapterDialogProps {
  chapter: Chapter;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PurchaseChapterDialog({
  chapter,
  open,
  onOpenChange,
  onSuccess,
}: PurchaseChapterDialogProps) {
  const { user } = useUserStore();
  const { mutate: purchaseChapter, isPending } = usePurchaseChapter();
  const router = useRouter();
  
  // Check if user has enough balance
  const chapterPrice = parseFloat(chapter.price || "0");
  const userBalance = user?.tokenBalance || 0;
  const hasEnoughBalance = userBalance >= chapterPrice;
  const percentageRemaining = hasEnoughBalance ? 100 : (userBalance / chapterPrice) * 100;

  const handlePurchase = () => {
    purchaseChapter(chapter.id, {
      onSuccess: () => {
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    });
  };
  
  const handleDeposit = () => {
    router.push('/deposit');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-md border border-gray-200">
          <BookOpen className="h-8 w-8 text-black" />
        </div>
        
        <AlertDialogHeader className="pt-6">
          <AlertDialogTitle className="text-center text-xl">
            Unlock Chapter
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="font-medium text-black block text-lg mt-1">
              {chapter.title || `Chapter ${chapter.chapter}`}
            </span>
          </AlertDialogDescription>
          
          {/* Chapter preview card */}
          <div className="mt-5 rounded-lg border border-gray-200 overflow-hidden bg-gradient-to-r from-gray-50 to-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-800">Chapter {chapter.chapter}</span>
              </div>
              <div className="text-sm font-medium text-black">
                {chapterPrice} <span className="text-amber-500">HARU</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600 line-clamp-1">{chapter.title || `Chapter ${chapter.chapter}`}</p>
            </div>
          </div>
          
          {/* Balance indicator */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-3">
              {/* Cost */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-600">Cost:</span>
                </div>
                <span className="font-medium text-black">{chapterPrice} HARU</span>
              </div>
              
              {/* Your balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">Your balance:</span>
                </div>
                <span className={`font-medium ${hasEnoughBalance ? 'text-green-600' : 'text-red-500'}`}>
                  {userBalance} HARU
                </span>
              </div>
              
              {/* Divider line */}
              <div className="border-t border-gray-200"></div>
              
              {/* After */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">After purchase:</span>
                </div>
                <span className="font-medium text-black">{(userBalance - chapterPrice).toFixed(2)} HARU</span>
              </div>
            </div>
          </div>
          
          {!hasEnoughBalance && (
            <div className="mt-5 bg-amber-50 rounded-lg border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Wallet className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-800">Insufficient balance</h4>
                  <p className="text-sm text-amber-700 mt-0.5">
                    You need {(chapterPrice - userBalance).toFixed(2)} more HARU to purchase this chapter.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3 bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={handleDeposit}
                  >
                    <Coins className="mr-2 h-4 w-4" />
                    Deposit HARU
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handlePurchase} 
            disabled={isPending || !hasEnoughBalance}
            className={`${hasEnoughBalance ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'} gap-2`}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Purchase Chapter
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 