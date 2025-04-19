'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, AlarmClock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  
  const { 
    verifyEmail, 
    isVerifyingEmail,
    isVerificationSuccessful,
    isVerificationFailed,
    verificationError,
    verificationData,
    resendVerification, 
    isResendingVerification 
  } = useAuth();
  
  const [verificationMessage, setVerificationMessage] = useState('');

  // Verify email with token when page loads
  useEffect(() => {
    if (!token) return;
    
    // Use the verifyEmail mutation from the auth hook
    verifyEmail(token);
  }, [token, verifyEmail]);
  
  // Handle verification success/failure
  useEffect(() => {
    if (isVerificationSuccessful) {
      setVerificationMessage(verificationData?.message || 'Your email has been successfully verified. You can now sign in.');
      
      // Redirect to sign in page after 3 seconds
      const redirectTimer = setTimeout(() => {
        router.push('/signin');
      }, 3000);
      
      return () => clearTimeout(redirectTimer);
    }
    
    if (isVerificationFailed) {
      setVerificationMessage(
        verificationError instanceof Error 
          ? verificationError.message 
          : 'Verification failed'
      );
    }
  }, [isVerificationSuccessful, isVerificationFailed, verificationData, verificationError, router]);

  const handleResendVerification = () => {
    if (!email) return;
    
    // Use the resendVerification mutation from the auth hook
    resendVerification(email);
  };

  // Show verification result if we have a token
  if (token && (isVerificationSuccessful || isVerificationFailed)) {
    return (
      <div className="flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {isVerificationSuccessful ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4">
                {isVerificationSuccessful ? 'Email Verified' : 'Verification Failed'}
              </h1>
              <p className="text-muted-foreground mb-6">{verificationMessage}</p>
              
              {isVerificationSuccessful ? (
                <p className="text-sm text-muted-foreground">Redirecting to sign in page...</p>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={handleResendVerification} 
                    variant="outline" 
                    className="w-full"
                    disabled={isResendingVerification || !email}
                  >
                    {isResendingVerification ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-primary"
                      onClick={() => router.back()}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (token && isVerifyingEmail) {
    return (
      <div className="flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Verifying Your Email</h1>
              <p className="text-muted-foreground">Please wait while we verify your email address...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default state - no token, show instructions to check email
  return (
    <div className="flex flex-col bg-background">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg border border-border bg-card">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-lg my-2">{email || 'your email address'}</p>
          </div>
          
          <div className="space-y-4 bg-secondary/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <AlarmClock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Verification link expires soon</h3>
                <p className="text-sm text-muted-foreground">
                  The verification link is only valid for 5 minutes. Please check your inbox and verify your email as soon as possible.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Check your spam folder</h3>
                <p className="text-sm text-muted-foreground">
                  If you don't see the email in your inbox, please check your spam or junk folder.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleResendVerification} 
              variant="outline" 
              className="w-full"
              disabled={isResendingVerification}
            >
              {isResendingVerification ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="link" 
                className="text-primary"
                onClick={() => router.back()}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 