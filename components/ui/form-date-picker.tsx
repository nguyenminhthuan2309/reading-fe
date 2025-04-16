"use client";

import * as React from "react";
import { FieldError } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";

interface FormDatePickerProps {
  label?: string;
  name: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  error?: FieldError;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FormDatePicker({
  label,
  name,
  date,
  setDate,
  error,
  placeholder = "Select date",
  disabled = false,
  required = false,
}: FormDatePickerProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <DatePicker
        date={date}
        setDate={setDate}
        placeholder={placeholder}
        fieldName={name}
        disabled={disabled}
      />
      {error && (
        <p className="text-xs text-destructive italic mt-0.5 px-3">{error.message}</p>
      )}
    </div>
  );
} 