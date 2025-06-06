"use client";

import * as React from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

// Custom styles for the MultiSelect component
const multiSelectStyles = {
  dropdown: "absolute top-full mt-1 w-full z-20 rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-600 shadow-lg overflow-y-auto",
  // Calculate min-height to show at least 5 items (each item is approximately 42px tall)
  minHeight: "min-h-[210px]",
  maxHeight: "max-h-[300px]",
  item: "cursor-pointer flex items-center py-2.5 px-2 hover:bg-muted/50 dark:hover:bg-gray-700/50 aria-selected:bg-muted dark:aria-selected:bg-gray-700 dark:text-white",
  checkbox: "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-yellow-500 dark:border-yellow-400",
  selectedCheckbox: "bg-yellow-600 text-white dark:bg-yellow-600 dark:text-white border-yellow-600 dark:border-yellow-600",
  emptyCheckbox: "opacity-50 dark:opacity-40",
};

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Improved unselect handler with more reliable propagation blocking
  const handleUnselect = React.useCallback((item: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newSelected = selected.filter(i => i !== item);
    onChange(newSelected);
  }, [selected, onChange]);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
    // Keep the dropdown open after selection
    setOpen(true);
    // Clear the input to show all options again
    setInputValue("");
    // Focus the input after selection
    inputRef.current?.focus();
  };

  // Handle focus management
  const handleContainerClick = () => {
    if (disabled) return;
    inputRef.current?.focus();
    setOpen(true);
  };

  // Prevent dropdown from closing when selecting an item
  const handleCommandMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background dark:bg-gray-800 dark:border-gray-600 px-3 py-2 text-sm ring-offset-background dark:text-white",
          disabled ? "opacity-50 cursor-not-allowed" : "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text"
        )}
        onClick={handleContainerClick}
      >
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((selectedItem) => (
              <Badge
                key={selectedItem}
                variant="secondary"
                className="px-2 py-1 text-xs flex items-center gap-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              >
                {options.find(opt => opt.value === selectedItem)?.label || selectedItem}
                <span 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleUnselect(selectedItem, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleUnselect(selectedItem, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="h-3 w-3 cursor-pointer flex items-center justify-center"
                  aria-label={`Remove ${options.find(opt => opt.value === selectedItem)?.label || selectedItem}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))}
          </div>
        )}
        <CommandPrimitive
          className="overflow-hidden p-0 flex-1 max-w-full"
        >
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onFocus={() => !disabled && setOpen(true)}
            onBlur={(e) => {
              // Only close if not clicking on the dropdown
              if (!e.relatedTarget?.closest('.command-wrapper')) {
                setTimeout(() => setOpen(false), 200);
              }
            }}
            placeholder={selected.length > 0 ? '' : placeholder}
            className="bg-transparent outline-none border-none p-1 text-sm flex-1 min-w-[80px] dark:text-white dark:placeholder-gray-400"
            disabled={disabled}
          />
        </CommandPrimitive>
      </div>
      {open && (
        <div className="command-wrapper" onMouseDown={handleCommandMouseDown}>
          <Command className={cn(multiSelectStyles.dropdown, multiSelectStyles.minHeight, multiSelectStyles.maxHeight)}>
            <CommandGroup className="h-full overflow-auto">
              {options.length === 0 && (
                <p className="py-2 px-3 text-sm text-muted-foreground dark:text-gray-400 text-center">
                  No items found.
                </p>
              )}
              {options
                .filter(opt => 
                  inputValue === "" || opt.label.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    className={multiSelectStyles.item}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className={cn(
                      multiSelectStyles.checkbox, 
                      selected.includes(option.value) ? multiSelectStyles.selectedCheckbox : multiSelectStyles.emptyCheckbox
                    )}>
                      {selected.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
} 