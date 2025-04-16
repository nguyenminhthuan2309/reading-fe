"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import { FormInput } from "@/components/ui/form-input";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";

// Define validation schema with Yup
const signinSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required"),
});

// Define the type for our form data
type SigninFormData = yup.InferType<typeof signinSchema>;

export default function SignIn() {
  const { login, isLoggingIn } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: yupResolver(signinSchema),
  });

  const onSubmit = async (data: SigninFormData) => {
    try {
      await login(data);
    } catch (error) {
      console.error("Error signing in:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-muted-foreground mt-2">Access your digital bookshelf and continue reading</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label="Email"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              required
              placeholder="Enter your email"
            />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <FormInput
                name="password"
                type="password"
                register={register}
                error={errors.password}
                required
                placeholder="Enter your password"
                label=""
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        
        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-card text-muted-foreground">or</span>
          </div>
        </div>
        
        {/* Continue without login button */}
        <div className="text-center">
          <Link href="/">
            <Button variant="link" className="text-muted-foreground hover:text-primary">
              Continue as a Guest
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 