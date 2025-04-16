"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { FieldError } from "react-hook-form";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  register: any;
  error?: FieldError;
  required?: boolean;
}

export function FormInput({
  label,
  name,
  register,
  error,
  required = false,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Input
        id={name}
        {...register(name)}
        {...props}
        aria-invalid={error ? "true" : "false"}
      />
      {error && (
        <p className="text-xs text-destructive italic mt-0.5 px-3">{error.message}</p>
      )}
    </div>
  );
} 