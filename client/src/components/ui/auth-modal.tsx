import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  User, 
  Upload, 
  Camera,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { FaGoogle, FaFacebook, FaTwitter, FaGithub } from "react-icons/fa";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { baseSignUpSchema } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = "signin" | "signup" | "forgot-password" | "otp-verification" | "reset-password";

const signinFormSchema = z.object({
  loginValue: z.string().min(1, "Email, username, or phone number is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

const signupFormSchema = baseSignUpSchema.extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  profilePhoto: z.any().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email, username, or phone number is required"),
});

const otpVerificationSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signinFormSchema>;
type SignUpFormData = z.infer<typeof signupFormSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const calculatePasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "Weak", color: "bg-red-500" };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  if (score < 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score < 4) return { score: 2, label: "Fair", color: "bg-yellow-500" };
  if (score < 5) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-green-500" };
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<ModalMode>("signin");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string>("");
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'reset'>('signup');
  const [signinError, setSigninError] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(new Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>(new Array(6).fill(null));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast} = useToast();
  const queryClient = useQueryClient();

  const signinForm = useForm<SignInFormData>({
    resolver: zodResolver(signinFormSchema),
    mode: "onSubmit",
    defaultValues: {
      loginValue: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignUpFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      profilePhoto: undefined,
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      identifier: "",
    },
  });

  const otpForm = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    mode: "onSubmit",
    defaultValues: {
      otp: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      signupForm.setValue("profilePhoto", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    const otpValue = newOtpDigits.join('');
    otpForm.setValue('otp', otpValue);
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedText)) return;
    
    const newDigits = pastedText.split('').concat(new Array(6 - pastedText.length).fill(''));
    setOtpDigits(newDigits);
    otpForm.setValue('otp', pastedText);
    
    const nextIndex = Math.min(pastedText.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const signinMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const payload = {
        identifier: data.loginValue,
        password: data.password,
        rememberMe: data.rememberMe
      };
      
      const response = await apiRequest("POST", "/api/auth/signin", payload);
      return response.json();
    },
    onSuccess: () => {
      setSigninError("");
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      if (error.status === 403 && error.body?.requiresVerification) {
        setSigninError("");
        setMode("otp-verification");
        setOtpSentTo(error.body.verificationTarget || "");
        setOtpPurpose('signup');
        toast({
          title: "Account Verification Required",
          description: "Verification code sent to your email. Please check your inbox and spam folder.",
          variant: "default",
        });
      } else {
        const errorMessage = error.message || "Invalid email/username or password. Please try again.";
        setSigninError(errorMessage);
        
        setTimeout(() => {
          toast({
            title: "Sign in failed",
            description: errorMessage,
            variant: "destructive",
          });
        }, 100);
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const { confirmPassword, profilePhoto, ...signupData } = data;
      
      let profileImageUrl = "";
      
      if (profilePhoto && profilePhoto instanceof File) {
        const formData = new FormData();
        formData.append('profilePhoto', profilePhoto);
        
        const uploadResponse = await fetch('/api/auth/upload-profile-photo', {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(errorText || 'Failed to upload profile photo');
        }
        
        const uploadResult = await uploadResponse.json();
        profileImageUrl = uploadResult.profileImageUrl;
      }
      
      const finalSignupData = {
        ...signupData,
        ...(profileImageUrl && { profileImageUrl })
      };
      
      const response = await apiRequest("POST", "/api/auth/signup", finalSignupData);
      return response.json();
    },
    onSuccess: (data) => {
      setMode("otp-verification");
      setOtpSentTo(data.verificationTarget || signupForm.getValues().email || signupForm.getValues().phoneNumber || "");
      setOtpPurpose('signup');
      toast({
        title: "Verify Your Account",
        description: "Verification code sent to your email. Please check your inbox and spam folder.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sign up failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setMode("otp-verification");
      setOtpSentTo(forgotPasswordForm.getValues().identifier);
      setOtpPurpose('reset');
      toast({
        title: "Reset Code Sent",
        description: "Password reset code sent to your email. Please check your inbox and spam folder.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const otpMutation = useMutation({
    mutationFn: async (data: OtpVerificationFormData) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        otp: data.otp,
        identifier: otpSentTo,
        purpose: otpPurpose
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.type === 'signup') {
        toast({
          title: "Account Verified!",
          description: "Your account has been verified and you are now signed in.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        onClose();
      } else if (data.type === 'reset') {
        toast({
          title: "Verification Complete!",
          description: "You can now set your new password.",
        });
        setMode("reset-password");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        identifier: otpSentTo,
        newPassword: data.newPassword,
        otpCode: otpForm.getValues().otp
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successfully!",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      setMode("signin");
      resetPasswordForm.reset();
      otpForm.reset();
      forgotPasswordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    switch (mode) {
      case "signin":
        setSigninError("");
        const signinValid = await signinForm.trigger();
        if (!signinValid) return;
        signinMutation.mutate(signinForm.getValues());
        break;
      case "signup":
        const signupValid = await signupForm.trigger();
        if (!signupValid) return;
        signupMutation.mutate(signupForm.getValues());
        break;
      case "forgot-password":
        const forgotValid = await forgotPasswordForm.trigger();
        if (!forgotValid) return;
        forgotPasswordMutation.mutate(forgotPasswordForm.getValues());
        break;
      case "otp-verification":
        const otpValid = await otpForm.trigger();
        if (!otpValid) return;
        otpMutation.mutate(otpForm.getValues());
        break;
      case "reset-password":
        const resetValid = await resetPasswordForm.trigger();
        if (!resetValid) return;
        resetPasswordMutation.mutate(resetPasswordForm.getValues());
        break;
    }
  };

  const isLoading = signinMutation.isPending || signupMutation.isPending || 
                   forgotPasswordMutation.isPending || otpMutation.isPending || resetPasswordMutation.isPending;

  const handleSocialAuth = (provider: string) => {
    const authUrl = `/api/auth/${provider.toLowerCase()}`;
    window.location.href = authUrl;
  };

  const passwordWatched = signupForm.watch("password");
  const passwordStrength = calculatePasswordStrength(passwordWatched || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/40 via-teal-900/40 to-blue-900/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent 
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border-0 bg-transparent p-0 shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus-visible:outline-none" 
          data-testid="auth-modal"
        >
          <div className="relative mx-4 rounded-3xl border border-white/20 bg-white/10 dark:bg-black/10 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
            
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-4xl font-bold text-white dark:text-white">cineHub</h1>
              <h2 className="text-2xl font-semibold text-white dark:text-white">
                {mode === "signin" && "Sign in"}
                {mode === "signup" && "Sign up"}
                {mode === "forgot-password" && "Reset password"}
                {mode === "otp-verification" && "Verify account"}
                {mode === "reset-password" && "New password"}
              </h2>
              <p className="mt-2 text-sm text-white/80 dark:text-white/70">
                {mode === "signin" && "Sign in to your account"}
                {mode === "signup" && "Create your account"}
                {mode === "forgot-password" && "Enter your email to reset"}
                {mode === "otp-verification" && `Code sent to ${otpSentTo}`}
                {mode === "reset-password" && "Enter your new password"}
              </p>
            </div>

            {mode !== "signin" && mode !== "signup" && (
              <button
                onClick={() => setMode("signin")}
                className="mb-4 flex items-center text-sm text-white/80 hover:text-white transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </button>
            )}

            {signinError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-white backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                {signinError}
              </div>
            )}

            {mode === "signin" && (
              <Form {...signinForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  <FormField
                    control={signinForm.control}
                    name="loginValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Email address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Please enter your email"
                            className="h-12 rounded-xl border border-white/20 bg-white/10 dark:bg-black/10 px-4 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            data-testid="input-login-credential"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signinForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="h-12 rounded-xl border border-white/20 bg-white/10 dark:bg-black/10 px-4 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <FormField
                      control={signinForm.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              data-testid="checkbox-remember-me"
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-white/80 font-normal cursor-pointer">Remember me</FormLabel>
                        </FormItem>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-sm text-white/80 hover:text-white transition-colors"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/30"
                    data-testid="button-submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/10 px-3 py-1 rounded-full text-white/70 backdrop-blur-sm">OR</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth("Google")}
                      className="h-12 rounded-xl border border-white/20 bg-white hover:bg-white/90 dark:bg-white dark:hover:bg-white/90 text-gray-900 font-medium flex items-center justify-center gap-2 transition-all"
                      data-testid="button-google-auth"
                    >
                      <FaGoogle className="h-5 w-5" />
                      Google
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth("Facebook")}
                      className="h-12 rounded-xl bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-medium flex items-center justify-center gap-2 transition-all"
                      data-testid="button-facebook-auth"
                    >
                      <FaFacebook className="h-5 w-5" />
                      Facebook
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth("Twitter")}
                      className="h-12 rounded-xl bg-black hover:bg-black/90 text-white font-medium flex items-center justify-center gap-2 transition-all"
                      data-testid="button-twitter-auth"
                    >
                      <FaTwitter className="h-5 w-5" />
                      Twitter
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSocialAuth("GitHub")}
                      className="h-12 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium flex items-center justify-center gap-2 transition-all"
                      data-testid="button-github-auth"
                    >
                      <FaGithub className="h-5 w-5" />
                      GitHub
                    </Button>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-sm text-white/70">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-sm font-semibold text-white hover:underline"
                      data-testid="link-create-account"
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {mode === "signup" && (
              <Form {...signupForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-2 border-white/30">
                        <AvatarImage src={profilePhotoPreview || undefined} />
                        <AvatarFallback className="bg-white/10 text-white backdrop-blur-sm">
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-lg hover:bg-primary/90 transition-colors"
                        data-testid="button-upload-photo"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                        data-testid="input-profile-photo"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-white dark:text-white">First name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-300" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-white dark:text-white">Last name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Doe"
                              className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-300" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="johndoe"
                            className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            data-testid="input-username"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@example.com"
                            className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        {field.value && (
                          <div className="mt-2 space-y-1">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={`h-1 flex-1 rounded-full ${
                                    level <= passwordStrength.score ? passwordStrength.color : 'bg-white/20'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-white/70">{passwordStrength.label}</p>
                          </div>
                        )}
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="h-10 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 px-3 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-confirm-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                              data-testid="button-toggle-confirm-password"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/30"
                    data-testid="button-submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Sign up"
                    )}
                  </Button>

                  <div className="mt-4 text-center">
                    <span className="text-sm text-white/70">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="text-sm font-semibold text-white hover:underline"
                      data-testid="link-sign-in"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {mode === "forgot-password" && (
              <Form {...forgotPasswordForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Email or username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your email or username"
                            className="h-12 rounded-xl border border-white/20 bg-white/10 dark:bg-black/10 px-4 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                            data-testid="input-identifier"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/30"
                    data-testid="button-submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      "Send reset code"
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {mode === "otp-verification" && (
              <Form {...otpForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-center text-sm text-white/70">
                      Please check your spam/junk folder if you don't see the email
                    </p>
                    <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="h-12 w-12 text-center text-lg font-bold border border-white/30 rounded-lg bg-white/10 dark:bg-black/10 text-white backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          data-testid={`input-otp-digit-${index}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || otpDigits.some(digit => !digit)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/30"
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-white/70 mb-2">Didn't receive the code?</p>
                    <button
                      type="button"
                      className="text-sm font-semibold text-white hover:underline"
                      data-testid="button-resend-otp"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {mode === "reset-password" && (
              <Form {...resetPasswordForm}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              className="h-12 rounded-xl border border-white/20 bg-white/10 dark:bg-black/10 px-4 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                              data-testid="button-toggle-new-password"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-white dark:text-white">Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              className="h-12 rounded-xl border border-white/20 bg-white/10 dark:bg-black/10 px-4 pr-12 text-white placeholder:text-white/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                              data-testid="input-confirm-new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                              data-testid="button-toggle-confirm-new-password"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-300" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/30"
                    data-testid="button-reset-password"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
