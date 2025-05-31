"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FormInput } from "@/components/ui/form-input";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signup } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { SignupCredentials } from "@/models";

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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [gender, setGender] = useState<string>("male");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Signup mutation using React Query directly
  const { mutate: signupMutation, isPending: isSigningUp } = useMutation({
    mutationFn: async (credentials: SignupCredentials) => {
      const response = await signup(credentials);
      
      if (response.status !== 201) {
        toast.error(response.msg);
        throw new Error(response.msg);
      }
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Signup failed');
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['me'], userData);
      router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
    }
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      signupMutation({ 
        name: data.name, 
        email: data.email, 
        password: data.password,
        gender: gender
      });
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create account");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="w-full max-w-md">
      <div className="p-8 space-y-6 rounded-lg shadow-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold dark:text-white">Sign Up</h1>
            <p className="text-muted-foreground dark:text-gray-300 mt-2">Join our online reading community today</p>
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
            
            <div className="space-y-2">
              <Label className="flex items-center dark:text-white">
                Gender
              </Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer dark:text-gray-300">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer dark:text-gray-300">
                    Female
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer dark:text-gray-300">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="relative">
              <FormInput
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                register={register}
                error={errors.password}
                required
                placeholder="Create a password"
              />
              <button
                type="button"
                className="absolute right-2 top-[38px] text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white p-1"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="relative">
              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                register={register}
                error={errors.confirmPassword}
                required
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute right-2 top-[38px] text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white p-1"
                onClick={toggleConfirmPasswordVisibility}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <Button type="submit" className="w-full dark:bg-red-600 dark:hover:bg-red-700 dark:text-white" disabled={isSigningUp}>
              {isSigningUp ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm dark:text-gray-300">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary dark:text-red-400 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
        
        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-card dark:bg-gray-800 text-muted-foreground dark:text-gray-400">or</span>
          </div>
        </div>
        
        {/* Continue without login button */}
        <div className="text-center">
          <Link href="/">
            <Button variant="link" className="text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-red-400">
              Continue as a Guest
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 