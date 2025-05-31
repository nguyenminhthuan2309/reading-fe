"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import { FormInput } from "@/components/ui/form-input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/lib/api/auth";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Cookies from "js-cookie";
import { useAvailableActivities } from "@/lib/hooks/useActivities";

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
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: yupResolver(signinSchema),
  });
  const { createActivity } = useAvailableActivities();
  
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setToken } = useUserStore();
  const queryClient = useQueryClient();

  const {mutate: loginMutation, isPending: isLoggingIn} = useMutation({
    mutationFn: async (data: SigninFormData) => {
      const res = await login(data)
      if (res.status === 201) {
        // Update Zustand store instead of localStorage
        setUser(res.data.user);
        setToken(res.data.accessToken);
        return res.data.user;
      } else {
        if (res.msg.includes('Mật khẩu')) {
          setError('password', { message: res.msg });
        } else {
          setError('email', { message: res.msg });
        }

        throw new Error(res.msg);
      }
    },
    onSuccess: (userData) => {
      // Set user role cookie
      if (userData.role?.name) {
        Cookies.set('user_role', userData.role.name, { 
          expires: 7, 
          secure: process.env.NODE_ENV === 'production' 
        });
      }

      // Update the user data in the query client
      queryClient.setQueryData(['me'], userData);

      // Create a login activity
      createActivity({
        activityType: 'login',
      });

      queryClient.clear();
      router.push('/');
    }
  });

  const onSubmit = async (data: SigninFormData) => {
    loginMutation(data)
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="p-8 space-y-6 rounded-lg shadow-lg border border-border dark:border-gray-700 bg-card dark:bg-gray-800">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold dark:text-white">Sign In</h1>
            <p className="text-muted-foreground dark:text-gray-300 mt-2">Access your digital bookshelf and continue reading</p>
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
                <label htmlFor="password" className="block text-sm font-medium dark:text-white">
                  Password <span className="text-destructive dark:text-red-400">*</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary dark:text-red-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FormInput
                  name="password"
                  type={showPassword ? "text" : "password"}
                  register={register}
                  error={errors.password}
                  required
                  placeholder="Enter your password"
                  label=""
                />
                <button
                  type="button"
                  className="absolute right-2 top-[6px] text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white p-1"
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
            </div>
            
            <Button type="submit" className="w-full dark:bg-red-600 dark:hover:bg-red-700 dark:text-white" disabled={isLoggingIn}>
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm dark:text-gray-300">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary dark:text-red-400 hover:underline">
                Sign Up
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