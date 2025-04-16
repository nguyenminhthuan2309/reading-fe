"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormInput } from "@/components/ui/form-input";
import { useAuth } from "@/lib/hooks";
import { toast } from "sonner";

// Define validation schema with Yup
const signupSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

// Define the type for our form data
type SignupFormData = yup.InferType<typeof signupSchema>;

export default function SignUp() {
  const { signup, isSigningUp } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({ 
        name: data.name, 
        email: data.email, 
        password: data.password 
      });
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-muted-foreground mt-2">Join our online reading community today</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label="Name"
              name="name"
              register={register}
              error={errors.name}
              required
              placeholder="Enter your name"
            />
            
            <FormInput
              label="Email"
              name="email"
              type="email"
              register={register}
              error={errors.email}
              required
              placeholder="Enter your email"
            />
            
            <FormInput
              label="Password"
              name="password"
              type="password"
              register={register}
              error={errors.password}
              required
              placeholder="Create a password"
            />
            
            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword}
              required
              placeholder="Confirm your password"
            />
            
            <Button type="submit" className="w-full" disabled={isSigningUp}>
              {isSigningUp ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary hover:underline">
                Sign In
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