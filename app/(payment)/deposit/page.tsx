"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  InfoIcon,
  Loader2,
  Copy,
  Crown,
  Gift,
  Plus,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { initPayment, checkPaymentStatus, CheckPaymentStatusResponse } from "@/lib/api/payment";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TransactionStatus } from "@/models/payment";
import { ApiResponse } from "@/models/api";
import { toast } from "sonner";
import { AUTH_KEYS, PAYMENT_KEYS, USER_KEYS } from "@/lib/constants/query-keys";
import { useMe } from "@/lib/hooks/useUsers";
// Define the exchange rate: 1 Haru = 1000 VND
const HARU_TO_VND_RATE = 1000;
const MIN_HARU_DEPOSIT = 30;

// Define deposit packages with bonus information
const DEPOSIT_PACKAGES = [
  {
    id: 1,
    coins: 30,
    bonus: 0,
    vnd: 30000,
    isVip: false,
    description: "Basic package"
  },
  {
    id: 2,
    coins: 100,
    bonus: 10,
    vnd: 100000,
    isVip: false,
    description: "10% bonus"
  },
  {
    id: 3,
    coins: 200,
    bonus: 40,
    vnd: 200000,
    isVip: false,
    description: "20% bonus"
  },
  {
    id: 4,
    coins: 500,
    bonus: 0,
    vnd: 500000,
    isVip: true,
    description: "VIP package - Daily reward: 1 coin for 30 days"
  }
];

// Stepper component
const DepositStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: "Amount" },
    { number: 2, title: "Payment" },
    { number: 3, title: currentStep === 4 ? "Error" : "Success" }
  ];

  return (
    <div className="w-full my-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex w-1/3 flex-col items-center relative">
            {/* Step circle */}
            <div className={`flex items-center justify-center h-10 w-10 rounded-full z-10 ${
              currentStep === step.number 
                ? step.number === 3 && currentStep === 4
                  ? 'bg-red-500 text-white' 
                  : step.number === 3 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-500 text-white'
                : currentStep > step.number
                ? 'bg-green-100 text-green-600 border-2 border-green-500'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {currentStep > step.number ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{step.number}</span>
              )}

              
            </div>
              { step.number !== 3 && (
                <div className={`absolute top-5 -z-10 left-[50%] w-[100%] h-1 bg-gray-200 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`}  />
              )}
            
            {/* Step title */}
            <span className={`text-xs mt-2 font-medium ${
              currentStep === step.number 
                ? step.number === 3 && currentStep === 4
                  ? 'text-red-600' 
                  : step.number === 3 
                  ? 'text-green-600' 
                  : 'text-amber-600'
                : currentStep > step.number 
                ? 'text-green-600' 
                : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DepositPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const { refetchUserInfo } = useMe();


  // Check for query params
  const orderIdParam = searchParams?.get('orderId') || '';
  const requestIdParam = searchParams?.get('requestId') || '';
  const amountParamStr = searchParams?.get('amount');

  // If amount param is provided in VND, convert back to Haru
  const haruAmountFromParam = amountParamStr && !isNaN(parseInt(amountParamStr))
    ? (() => {
        const vndAmount = parseInt(amountParamStr);
        const matchingPackage = DEPOSIT_PACKAGES.find(pkg => pkg.vnd === vndAmount);
        return matchingPackage ? matchingPackage.coins : Math.round(vndAmount / HARU_TO_VND_RATE);
      })()
    : undefined;
  const [amount, setAmount] = useState<number>(
    haruAmountFromParam && haruAmountFromParam >= MIN_HARU_DEPOSIT
      ? haruAmountFromParam
      : DEPOSIT_PACKAGES[0].coins
  );
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment Method, 3: Success, 4: Error
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<{ message: string; resultCode?: number } | null>(null);
  
  // React Query mutation for initiating payment
  const paymentMutation = useMutation({
    mutationFn: (haruAmount: number) => {
      // Find the package that matches the amount to get the correct VND value
      const matchingPackage = DEPOSIT_PACKAGES.find(pkg => pkg.coins === haruAmount);
      const vndAmount = matchingPackage ? matchingPackage.vnd : haruAmount * HARU_TO_VND_RATE;
      return initPayment(vndAmount);
    },
    onSuccess: (res) => {
      if ((res.status === 200 || res.status === 201 )&& res.data.url) {
        window.location.href = res.data.url;
      }
    }
  });

  
  // React Query for checking transaction status
  const { data: transactionData, isLoading: isCheckingTransaction, error: transactionError } = 
    useQuery({
      queryKey: PAYMENT_KEYS.TRANSACTION(String(orderIdParam), requestIdParam),
      queryFn: async () => {
        const response: ApiResponse<CheckPaymentStatusResponse> = await checkPaymentStatus(requestIdParam, orderIdParam);
        if (response.code !== 200) {
          throw new Error(response.msg || 'Failed to check payment status');
        }
        
        // Check MoMo result code
        if (response.data.momoResponse.resultCode !== 0) {
          setPaymentError({
            message: response.data.momoResponse.message || 'Payment failed',
            resultCode: response.data.momoResponse.resultCode
          });
          setStep(4); // Error step
          setSelectedPaymentMethod('momo');
          return response.data;
        }
        
        // Success case
        setStep(3);
        setSelectedPaymentMethod('momo');
        setPaymentError(null);

        // Force refetch the user data
        refetchUserInfo();
        queryClient.invalidateQueries({ queryKey: USER_KEYS.BALANCE(Number(user?.id)) });
        return response.data;
      },
      enabled: !!orderIdParam && !!requestIdParam && !!user,
      staleTime: 0,
      refetchOnWindowFocus: false,
    });

  
  // If no user is logged in, redirect to login
  if (!user) {
    router.push('/signin');
    return null;
  }
  
  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };
  
  const handleContinue = () => {
    setStep(2);
    setSelectedPaymentMethod('momo');
  };
  
  const handleSelectPaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
  };
  
  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) return;
    
    if (selectedPaymentMethod === 'momo') {
      // Call the MoMo payment API using React Query mutation
      paymentMutation.mutate(amount);
    }
  };

  
  const handleBackToProfile = () => {
    // Navigate to the balance section of user profile
    router.push(`/user/${user.id}?section=balance`);
  };
  
  // Helper function to format VND amount
  const formatVND = (haruAmount: number) => {
    // Find the package that matches the amount to get the correct VND value
    const matchingPackage = DEPOSIT_PACKAGES.find(pkg => pkg.coins === haruAmount);
    const vndAmount = matchingPackage ? matchingPackage.vnd : haruAmount * HARU_TO_VND_RATE;
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(vndAmount);
  };
  
  // Copy handler
  const handleCopy = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };
  
  // Loading state when checking transaction on page load
  if (requestIdParam && orderIdParam && isCheckingTransaction) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center h-[60vh]">
        <Loader2 size={36} className="animate-spin text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2">Verifying Payment</h3>
        <p className="text-muted-foreground text-center">
          Please wait while we verify your transaction...
        </p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">Deposit Haru</h2>
        <DepositStepper currentStep={step} />
      </div>
      
      <Card className="bg-secondary/20 border-secondary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 4 ? (
              <>
                <XCircle size={20} className="text-red-500" />
                Deposit Failed
              </>
            ) : step === 3 ? (
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
            {step === 3 && `${amount} Haru purchase completed successfully`}
            {step === 4 && "Your payment could not be processed"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Select a Package
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose from our available packages with bonus coins and special benefits
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEPOSIT_PACKAGES.map((pkg) => {
                    const isSelected = amount === pkg.coins;
                    
                    return (
                      <Button
                        key={pkg.id}
                        variant="outline"
                        className={`relative h-auto p-3 flex flex-col items-center justify-center ${
                          isSelected 
                            ? 'bg-yellow-100 border-yellow-400 text-yellow-800' 
                            : pkg.isVip 
                            ? 'border-yellow-300' 
                            : ''
                        }`}
                        onClick={() => handleQuickAmount(pkg.coins)}
                      >
                        {pkg.isVip && (
                          <Crown size={10} className="absolute top-1 right-1 text-yellow-500" />
                        )}
                        
                        <div className="text-base font-bold mb-1">
                          {pkg.coins}
                          {pkg.bonus > 0 && (
                            <span className="text-green-600 text-xs ml-1">+{pkg.bonus}</span>
                          )}
                        </div>
                        
                        <div className="text-xs opacity-70">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            maximumFractionDigits: 0
                          }).format(pkg.vnd)}
                        </div>
                      </Button>
                    );
                  })}
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
                {(() => {
                  const selectedPackage = DEPOSIT_PACKAGES.find(pkg => pkg.coins === amount);
                  return (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Coins to purchase:</span>
                        <span className="font-medium">{amount} Haru</span>
                      </div>
                      {selectedPackage?.bonus && selectedPackage.bonus > 0 && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm flex items-center gap-1">
                            <Gift size={14} className="text-green-500" />
                            Bonus included:
                          </span>
                          <span className="font-medium text-green-600">+{selectedPackage.bonus} Haru</span>
                        </div>
                      )}
                      {selectedPackage?.isVip && (
                        <div className="flex justify-between mb-2">
                          <span className="text-sm flex items-center gap-1">
                            <Crown size={14} className="text-yellow-500" />
                            VIP Benefit:
                          </span>
                          <span className="font-medium text-yellow-600">Daily rewards</span>
                        </div>
                      )}
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Payment fee:</span>
                        <span className="font-medium">0 VND</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-secondary/30">
                        <span className="text-sm font-medium">Amount to pay:</span>
                        <span className="font-medium text-primary">{formatVND(amount)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {(paymentMutation.error || transactionError) && (
                <div className="p-3 border border-red-300 bg-red-50 text-red-800 rounded-md text-sm flex items-start">
                  <InfoIcon size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>
                    {paymentMutation.error 
                      ? "Failed to initiate payment. Please try again." 
                      : transactionError ? "Payment verification failed. Please contact support." : ""}
                  </p>
                </div>
              )}
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
                  Your {amount} Haru purchase was successful
                </p>
                <div className="bg-secondary/30 rounded-md p-4 mb-4">
                  {(() => {
                    const selectedPackage = DEPOSIT_PACKAGES.find(pkg => pkg.coins === amount);
                    return (
                      <>
                        <div className="flex justify-between mb-2">
                          <span>Payment Method:</span>
                          <span>{selectedPaymentMethod === 'momo' ? 'MoMo E-Wallet' : 'Card'}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Coins Purchased:</span>
                          <div className="text-right">
                            <span className="font-medium">{amount} Haru</span>
                            {selectedPackage?.bonus && selectedPackage.bonus > 0 && (
                              <p className="text-xs text-green-600 mt-0.5">+{selectedPackage.bonus} bonus coins included</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Amount Paid:</span>
                          <div className="text-right">
                            <span className="font-medium">{formatVND(amount)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Order ID:</span>
                          <div className="flex items-center">
                            <span className="font-mono text-xs">{transactionData?.orderId}</span>
                            <Copy className="ml-2 h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary" onClick={() => handleCopy(orderIdParam)} />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="py-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center">
                    <XCircle size={32} className="text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Payment Failed</h3>
                <p className="text-muted-foreground mb-6">
                  {paymentError?.message || 'Your payment could not be processed'}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>Payment Method:</span>
                    <span>{selectedPaymentMethod === 'momo' ? 'MoMo E-Wallet' : 'Card'}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Amount Attempted:</span>
                    <span className="font-medium">{formatVND(amount)}</span>
                  </div>
                  {paymentError?.resultCode && (
                    <div className="flex justify-between mb-2">
                      <span>Error Code:</span>
                      <span className="font-mono text-sm text-red-600">{paymentError.resultCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-2">
                    <span>Order ID:</span>
                    <div className="flex items-center">
                      <span className="font-mono text-xs">{transactionData?.orderId}</span>
                      <Copy className="ml-2 h-4 w-4 cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => handleCopy(orderIdParam)} />
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
                  <p className="text-sm text-amber-800">
                    💡 If you continue to experience issues, please contact our support team with your Order ID.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          {step === 1 && (
            <>
              <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Total to pay:</span>
                  <span className="text-lg font-semibold text-primary">{formatVND(amount)}</span>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="w-1/2" 
                    onClick={() => router.back()}
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    className="w-1/2" 
                    onClick={handleContinue}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {step === 2 && (
            <div className="w-full flex flex-row gap-3">
              <Button 
                variant="outline" 
                className="w-1/2"
                onClick={() => {
                  setStep(1);
                  setSelectedPaymentMethod(null);
                }}
              >
                Update Haru
              </Button>
              <Button 
                className="w-1/2"
                onClick={handleProcessPayment}
                disabled={paymentMutation.isPending || !selectedPaymentMethod }
              >
                {paymentMutation.isPending  ? (
                  <span className="flex items-center">
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>Pay {amount} Haru</>
                )}
              </Button>
            </div>
          )}
          
          {step === 3 && (
            <div className="w-full flex gap-4">
              <Link href={`/user/${user.id}?section=balance`} className="flex-1">
                <Button className="w-full" variant="outline">
                  Return to Profile
                </Button>
              </Link>
              <Link href="/books" className="flex-1">
                <Button className="w-full">
                  Browse Books
                </Button>
              </Link>
            </div>
          )}
          
          {step === 4 && (
            <div className="w-full flex gap-4">
              <Button 
                className="flex-1" 
                variant="outline" 
                onClick={() => {
                  setStep(1);
                  setPaymentError(null);
                  setSelectedPaymentMethod(null);
                }}
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </Button>
              <Link href={`/user/${user.id}?section=balance`} className="flex-1">
                <Button className="w-full" variant="outline">
                  Return to Profile
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 