import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, ChevronLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODERATION_MODELS, ModerationModelType } from "@/lib/hooks/useOpenAI";

interface ModerateButtonProps {
  selectedModel: ModerationModelType;
  onModelSelect: (model: ModerationModelType) => void;
  onModerate: () => void;
  isLoading?: boolean;
}

export function ModerateButton({
  selectedModel,
  onModelSelect,
  onModerate,
  isLoading = false
}: ModerateButtonProps) {
  const [showModelSelection, setShowModelSelection] = useState(false);

  const toggleModelSelection = () => {
    setShowModelSelection(prev => !prev);
  };

  const modelLabels = {
    [MODERATION_MODELS.OMNI]: 'Basic Moderation (Free)',
    [MODERATION_MODELS.GPT4O]: 'GPT-4o ($2.50/1M tokens)',
    [MODERATION_MODELS.O4_MINI]: 'o4-mini ($1.10/1M tokens)'
  };

  return (
    <div className="relative">
      {/* Model Selection UI - Shown when toggleModelSelection is clicked */}
      {showModelSelection && (
        <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-md border shadow-md z-20 w-[320px]">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-sm">Select Moderation Model</h4>
          </div>
          
          <div className="space-y-3">
            {/* Omni Moderation - Free */}
            <div className="flex items-start">
              <input 
                type="radio" 
                id="model-omni" 
                name="model" 
                className="mt-1"
                checked={selectedModel === MODERATION_MODELS.OMNI} 
                onChange={() => onModelSelect(MODERATION_MODELS.OMNI)}
              />
              <div className="ml-2">
                <label htmlFor="model-omni" className="text-sm font-medium flex items-center">
                  Basic Moderation
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Free</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Basic content moderation with standard detection
                </p>
              </div>
            </div>
            
            {/* GPT-4o */}
            <div className="flex items-start">
              <input 
                type="radio" 
                id="model-gpt4o" 
                name="model" 
                className="mt-1"
                checked={selectedModel === MODERATION_MODELS.GPT4O} 
                onChange={() => onModelSelect(MODERATION_MODELS.GPT4O)}
              />
              <div className="ml-2">
                <label htmlFor="model-gpt4o" className="text-sm font-medium flex items-center">
                  GPT-4o
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">$2.50/1M tokens</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Advanced detection with high accuracy and detailed feedback
                </p>
              </div>
            </div>
            
            {/* o4-mini */}
            <div className="flex items-start">
              <input 
                type="radio" 
                id="model-o4mini" 
                name="model" 
                className="mt-1"
                checked={selectedModel === MODERATION_MODELS.O4_MINI} 
                onChange={() => onModelSelect(MODERATION_MODELS.O4_MINI)}
              />
              <div className="ml-2">
                <label htmlFor="model-o4mini" className="text-sm font-medium flex items-center">
                  o4-mini
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">$1.10/1M tokens</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Balanced option with good detection at lower cost
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t flex justify-between">
            <button 
              type="button" 
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={toggleModelSelection}
            >
              Cancel
            </button>
            <Button 
              size="sm" 
              onClick={() => {
                toggleModelSelection();
                onModerate();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Moderating...
                </>
              ) : "Run Moderation"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Split Moderation Button */}
      <div className="flex items-stretch h-9">
        <Button
          type="button"
          variant="outline"
          onClick={onModerate}
          disabled={isLoading}
          className="rounded-r-none border-r-0 px-3"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Moderating...
            </>
          ) : (
            <>
              <Shield size={16} className="mr-2" />
              <span>Moderate</span>
             
            </>
          )}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                onClick={toggleModelSelection}
                disabled={isLoading}
                className="rounded-l-none px-2"
              >
                 <span className="text-xs text-muted-foreground">
                {selectedModel === MODERATION_MODELS.OMNI ? '(omni-moderation-latest)' : 
                selectedModel === MODERATION_MODELS.GPT4O ? '(gpt-4o)' : 
                '(o4-mini)'}
              </span>
                <ChevronLeft size={16} className={`transition-transform ${showModelSelection ? 'rotate-90' : '-rotate-90'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{modelLabels[selectedModel]}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 