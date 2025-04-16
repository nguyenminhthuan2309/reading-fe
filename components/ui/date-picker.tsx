"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  fieldName?: string;
}

interface MonthSelectorProps {
  displayMonth: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "Pick a date",
  disabled = false,
  fieldName,
}: DatePickerProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  
  // Custom month/year selector
  const MonthYearSelector = ({ displayMonth, onChange }: MonthSelectorProps) => {
    // Get array of months
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(i);
      return { value: i.toString(), label: format(d, 'MMMM') };
    });
    
    // Get array of years (100 years back, to current year)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => {
      const year = currentYear - 99 + i;
      return { value: year.toString(), label: year.toString() };
    });
    
    return (
      <div className="flex justify-between items-center px-2 py-1">
        <Button
          variant="ghost"
          className="p-1 h-auto"
          onClick={() => {
            const prev = new Date(displayMonth);
            prev.setMonth(prev.getMonth() - 1);
            onChange(prev);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1">
          <Select
            value={displayMonth.getMonth().toString()}
            onValueChange={(value: string) => {
              const newDate = new Date(displayMonth);
              newDate.setMonth(parseInt(value));
              onChange(newDate);
            }}
          >
            <SelectTrigger className="h-8 w-[105px]">
              <SelectValue placeholder={format(displayMonth, 'MMMM')} />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={displayMonth.getFullYear().toString()}
            onValueChange={(value: string) => {
              const newDate = new Date(displayMonth);
              newDate.setFullYear(parseInt(value));
              onChange(newDate);
            }}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue placeholder={displayMonth.getFullYear().toString()} />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="ghost"
          className="p-1 h-auto"
          onClick={() => {
            const next = new Date(displayMonth);
            next.setMonth(next.getMonth() + 1);
            onChange(next);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };
  
  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          aria-label={fieldName ? `Select ${fieldName}` : "Select date"}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            setDate(date);
            setCalendarOpen(false);
          }}
          initialFocus
          disabled={(date) => disabled || date > new Date()}
          captionLayout="buttons"
          fromYear={new Date().getFullYear() - 99}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  );
} 