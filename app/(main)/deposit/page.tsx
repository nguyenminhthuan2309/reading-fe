"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  CreditCard, 
  ArrowUpCircle, 
  Star, 
  ChevronRight, 
  CheckCircle2, 
  Wallet,
  LockIcon,
  InfoIcon
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { updateUserProfile } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DepositPage() {
  const router = useRouter();
  const { user, token } = useUserStore();
  const [amount, setAmount] = useState(100);
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Method, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  // If no user is logged in, redirect to login
  if (!user) {
    router.push('/signin');
    return null;
  }
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };
  
  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };
  
  const handleContinue = () => {
    setStep(2);
  };
  
  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
  };
  
  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user's points in the database
      await updateUserProfile(user.id, {
        points: (user.points || 0) + amount
      }, token || undefined);
      
      // Move to success screen
      setStep(3);
    } catch (error) {
      console.error("Payment processing error:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFinish = () => {
    // Navigate to the balance section of user profile
    router.push(`/user/${user.id}?section=balance`);
  };
  
  const handleBackToProfile = () => {
    // Navigate to the balance section of user profile
    router.push(`/user/${user.id}?section=balance`);
  };
  
  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-3" 
        onClick={() => {
          if (step === 1) {
            handleBackToProfile();
          } else {
            setStep(step - 1);
            if (step === 2) setSelectedPaymentMethod(null);
          }
        }}
      >
        <ArrowLeft size={16} className="mr-2" />
        {step === 1 ? "Back" : "Previous Step"}
      </Button>
      
      <Card className="bg-secondary/20 border-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 3 ? (
              <>
                <CheckCircle2 size={20} className="text-green-500" />
                Deposit Successful
              </>
            ) : (
              <>
                <ArrowUpCircle size={20} className="text-primary" />
                Deposit Haru
              </>
            )}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Add funds to your Haru balance"}
            {step === 2 && "Select your payment method"}
            {step === 3 && `${amount} Haru has been added to your account`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Amount to Deposit
                </label>
                <div className="flex items-center">
                  <div className="bg-secondary/30 flex items-center justify-center w-10 h-10 rounded-l-md border border-secondary/40">
                    <Star size={18} className="text-primary" />
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={handleAmountChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  Quick Amounts
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((value) => (
                    <Button
                      key={value}
                      variant={amount === value ? "default" : "outline"}
                      className="h-12"
                      onClick={() => handleQuickAmount(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium mb-2">
                Payment Methods
              </p>
              
              {/* Credit Card - Disabled with Coming Soon tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center p-4 border border-secondary/40 rounded-md bg-secondary/20 opacity-70 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <CreditCard size={20} />
                        <div>
                          <p className="font-medium">Credit / Debit Card</p>
                          <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LockIcon size={14} />
                        <span>Coming Soon</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Credit/Debit card payments will be available soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* MoMo E-Wallet */}
              <div
                className={`flex justify-between items-center p-4 border rounded-md cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'momo' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-secondary/40 hover:bg-secondary/30'
                }`}
                onClick={() => handleSelectPaymentMethod('momo')}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-pink-600 w-6 h-6 rounded-full flex items-center justify-center">
                    <Wallet size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium">MoMo E-Wallet</p>
                    <p className="text-xs text-muted-foreground">Fast and secure payments</p>
                  </div>
                </div>
                <ChevronRight size={18} className={selectedPaymentMethod === 'momo' ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              
              <div className="mt-6 p-4 border border-secondary/30 rounded-md bg-secondary/10">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Amount:</span>
                  <span className="font-medium">{amount} Haru</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Fee:</span>
                  <span className="font-medium">0 Haru</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-secondary/30">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="font-medium">{amount} Haru</span>
                </div>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="py-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Deposit Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  {amount} Haru has been successfully added to your account
                </p>
                <div className="bg-secondary/30 rounded-md p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>New Balance:</span>
                    <span className="font-bold">{(user.points || 0) + amount} Haru</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Payment Method:</span>
                    <span>{selectedPaymentMethod === 'momo' ? 'MoMo E-Wallet' : 'Card'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">
                      {`HARU${Date.now().toString().slice(-8)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {step === 1 && (
            <Button 
              className="w-full" 
              onClick={handleContinue}
              disabled={amount <= 0}
            >
              Continue
            </Button>
          )}
          
          {step === 2 && (
            <Button 
              className="w-full"
              onClick={handleProcessPayment}
              disabled={isProcessing || !selectedPaymentMethod}
            >
              {isProcessing ? "Processing..." : `Pay ${amount} Haru`}
            </Button>
          )}
          
          {step === 3 && (
            <Button 
              className="w-full"
              onClick={handleFinish}
            >
              Return to Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 