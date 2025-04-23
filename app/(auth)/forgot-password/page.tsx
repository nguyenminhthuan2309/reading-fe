"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { forgotPassword, verifyResetPassword } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft } from "lucide-react";

// Define reset password schema
const resetPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

// Define OTP verification schema
const otpVerificationSchema = yup.object({
  otp: yup
    .string()
    .required("OTP code is required")
    .length(6, "OTP code must be 6 characters"),
});

// Define the type for our form data
type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
type OtpVerificationFormData = yup.InferType<typeof otpVerificationSchema>;

// Function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [resetStep, setResetStep] = useState<'email' | 'otp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Email step state
  const [resetEmail, setResetEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  
  // OTP step state
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError] = useState("");
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); // 5 minutes in seconds
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  
  // Initialize OTP input refs
  useEffect(() => {
    otpRefs.current = otpRefs.current.slice(0, 6);
  }, []);

  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (resetStep === 'otp' && otpTimeLeft > 0) {
      timer = setInterval(() => {
        setOtpTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (otpTimeLeft === 0) {
      setIsOtpExpired(true);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resetStep, otpTimeLeft]);
  
  // Handle sending reset password email
  const handleSendResetEmail = async () => {
    // Reset error state
    setEmailError("");
    
    // Validate email
    try {
      await resetPasswordSchema.validate({ email: resetEmail });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setEmailError(error.message);
      }
      return;
    }
    
    // Call reset password API through auth service
    setIsSubmitting(true);
    try {
      const response = await forgotPassword(resetEmail);
      
      if (response.status === 201) {
        toast.success("OTP code has been sent to your email");
        // Reset OTP timer and expired state
        setOtpTimeLeft(300);
        setIsOtpExpired(false);
        // Clear OTP inputs
        setOtpValues(Array(6).fill(''));
        // Move to OTP verification step
        setResetStep('otp');
      } else {
        setEmailError(response.msg || "Failed to send reset email");
      }
    } catch (error) {
      setEmailError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle back to email from OTP step
  const handleBackToEmail = () => {
    setResetStep('email');
  };
  
  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(0, 1);
    setOtpValues(newOtpValues);
    
    // Move to next input if current input is filled
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace key
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // If the pasted data is a valid 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpValues(digits);
      
      // Focus the last input
      otpRefs.current[5]?.focus();
    }
  };
  
  // Handle OTP verification
  const handleVerifyOtp = async () => {
    // Reset error state
    setOtpError("");
    
    // Check if OTP is expired
    if (isOtpExpired) {
      setOtpError("OTP code has expired. Please resend a new code.");
      return;
    }
    
    // Combine OTP values
    const otpCode = otpValues.join('');
    
    // Validate OTP
    try {
      await otpVerificationSchema.validate({ otp: otpCode });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        setOtpError(error.message);
      }
      return;
    }
    
    // Call API to verify OTP using auth service
    setIsSubmitting(true);
    try {
      const response = await verifyResetPassword(resetEmail, otpCode);
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Password reset successful! A new password has been sent to your email.");
        // Redirect to signin page after successful verification
        router.push('/signin');
      } else {
        setOtpError(response.msg || "Invalid OTP code. Please try again.");
      }
    } catch (error) {
      setOtpError("Failed to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle resending OTP
  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    try {
      const response = await forgotPassword(resetEmail);
      
      if (response.status === 201) {
        // Reset OTP timer and expired state
        setOtpTimeLeft(300);
        setIsOtpExpired(false);
        // Clear OTP inputs
        setOtpValues(Array(6).fill(''));
        toast.success("New OTP code has been sent to your email");
      } else {
        setOtpError(response.msg || "Failed to resend OTP");
      }
    } catch (error) {
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-2">
            {resetStep === 'email' 
              ? "Enter your email to receive a reset code" 
              : "Enter the verification code sent to your email"}
          </p>
        </div>

        {resetStep === 'email' ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium mb-2">
                Email <span className="text-destructive">*</span>
              </label>
              <Input 
                type="email" 
                id="reset-email" 
                className={emailError ? 'border-destructive' : ''}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
              />
              {emailError && (
                <p className="text-destructive text-sm mt-1">{emailError}</p>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={handleSendResetEmail} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm">
                Code sent to <span className="font-medium">{resetEmail}</span>
              </p>
            </div>
              
            <div>
              <label htmlFor="otp-code-0" className="block text-sm font-medium mb-2">
                Verification Code <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2 w-full">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    id={`otp-code-${index}`}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                      return undefined;
                    }}
                    type="text"
                    inputMode="numeric"
                    className={`text-center text-lg font-bold aspect-square p-0 flex items-center justify-center h-12 ${otpError ? 'border-destructive' : ''}`}
                    value={otpValues[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    maxLength={1}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-destructive text-sm mt-1">{otpError}</p>
              )}
            </div>
              
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>OTP code is valid for 5 minutes.</span>
              <div className="flex items-center">
                <span className={`font-medium ${otpTimeLeft <= 60 ? 'text-destructive' : ''}`}>
                  {isOtpExpired ? (
                    <span className="text-destructive flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Expired
                    </span>
                  ) : (
                    `${formatTime(otpTimeLeft)}`
                  )}
                </span>
                {isOtpExpired && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs ml-2"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp}
                  >
                    {isResendingOtp ? "Resending..." : "Resend code"}
                  </Button>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              After verification, a new password will be sent to your email.
            </div>

            <div className="flex gap-4 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleBackToEmail}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Email
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleVerifyOtp}
                disabled={isSubmitting || isOtpExpired || otpValues.some(val => val === '')}
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/signin" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 