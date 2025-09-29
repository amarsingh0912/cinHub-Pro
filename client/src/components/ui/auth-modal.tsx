import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  User, 
  LogIn, 
  UserPlus, 
  Upload, 
  Camera,
  Key,
  ArrowLeft,
  X,
  Loader2,
  Check,
  AlertCircle
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

// Form schemas for different authentication flows
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

// Password strength calculation
const calculatePasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "Weak", color: "text-red-500" };
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  if (score < 2) return { score: 1, label: "Weak", color: "text-red-500" };
  if (score < 4) return { score: 2, label: "Fair", color: "text-yellow-500" };
  if (score < 5) return { score: 3, label: "Good", color: "text-blue-500" };
  return { score: 4, label: "Strong", color: "text-green-500" };
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
  const { toast } = useToast();
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
    if (value.length > 1) return; // Only allow single digit
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    // Update form value
    const otpValue = newOtpDigits.join('');
    otpForm.setValue('otp', otpValue);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Focus previous input on backspace
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
    
    // Focus last filled input or next empty one
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
      // Clear any previous errors
      setSigninError("");
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      // Handle unverified user case (403 status)
      if (error.status === 403 && error.body?.requiresVerification) {
        setSigninError("");
        setMode("otp-verification");
        setOtpSentTo(error.body.verificationTarget || "");
        setOtpPurpose('signup');
        toast({
          title: "Account Verification Required",
          description: error.body.message || "Please verify your account first.",
          variant: "default",
        });
      } else {
        // Set error message and keep modal open
        const errorMessage = error.message || "Invalid email/username or password. Please try again.";
        setSigninError(errorMessage);
        
        // Show toast with delay
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
      
      // Handle profile photo upload if a file is selected
      if (profilePhoto && profilePhoto instanceof File) {
        const formData = new FormData();
        formData.append('profilePhoto', profilePhoto);
        
        const uploadResponse = await fetch('/api/auth/upload-profile-photo', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload profile photo');
        }
        
        const uploadResult = await uploadResponse.json();
        profileImageUrl = uploadResult.profileImageUrl;
      }
      
      // Include profile image URL in signup data
      const finalSignupData = {
        ...signupData,
        ...(profileImageUrl && { profileImageUrl })
      };
      
      const response = await apiRequest("POST", "/api/auth/signup", finalSignupData);
      return response.json();
    },
    onSuccess: (data) => {
      // Move to OTP verification for account verification
      setMode("otp-verification");
      setOtpSentTo(data.verificationTarget || signupForm.getValues().email || signupForm.getValues().phoneNumber || "");
      setOtpPurpose('signup');
      toast({
        title: "Verify Your Account",
        description: data.message || "Please check your email or phone for the verification code.",
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
      // TODO: Implement forgot password API
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setMode("otp-verification");
      setOtpSentTo(forgotPasswordForm.getValues().identifier);
      setOtpPurpose('reset');
      toast({
        title: "Reset Code Sent",
        description: "Please check your email or phone for the password reset code.",
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
        // Transition to password reset form
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
      // Clear forms
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
        // Clear any previous errors before submitting
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
    // Redirect to OAuth endpoint
    const authUrl = `/api/auth/${provider.toLowerCase()}`;
    window.location.href = authUrl;
  };

  const getModalTitle = () => {
    switch (mode) {
      case "signin":
        return "Welcome Back";
      case "signup":
        return "Join CineHub Pro";
      case "forgot-password":
        return "Reset Password";
      case "otp-verification":
        return "Verify Your Account";
      case "reset-password":
        return "Reset Your Password";
      default:
        return "Welcome Back";
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case "signin":
        return "Sign in to access your personalized movie experience, create watchlists, and get recommendations.";
      case "signup":
        return "Create your account to start building watchlists, writing reviews, and discovering great content.";
      case "forgot-password":
        return "Enter your email, username, or phone number to receive a password reset code.";
      case "otp-verification":
        return `Enter the 6-digit verification code sent to ${otpSentTo}.`;
      case "reset-password":
        return "Enter your new password below. Make sure it's secure and easy to remember.";
      default:
        return "Sign in to access your account.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[min(100vw-2rem,28rem)] sm:w-[32rem] md:w-[40rem] p-0 sm:p-8 md:p-10 sm:rounded-3xl overflow-hidden border-2 border-border/30 backdrop-blur-xl bg-gradient-to-b from-background/98 via-background/95 to-background/98 shadow-2xl shadow-primary/20" data-testid="auth-modal">
        <div className="flex flex-col max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[90dvh]">
          <DialogHeader className="shrink-0 px-6 pt-8 sm:px-0 sm:pt-0 text-center">
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary rounded-3xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500">
                  {mode === "signin" && <LogIn className="w-10 h-10 text-white drop-shadow-lg" />}
                  {mode === "signup" && <UserPlus className="w-10 h-10 text-white drop-shadow-lg" />}
                  {mode === "forgot-password" && <Key className="w-10 h-10 text-white drop-shadow-lg" />}
                  {mode === "otp-verification" && <Mail className="w-10 h-10 text-white drop-shadow-lg" />}
                  {mode === "reset-password" && <Key className="w-10 h-10 text-white drop-shadow-lg" />}
                </div>
              </div>
              <DialogTitle className="text-center text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent mb-4 mt-6">
                {getModalTitle()}
              </DialogTitle>
              <DialogDescription className="text-center text-base sm:text-lg text-muted-foreground/90 max-w-md leading-relaxed">
                {getModalDescription()}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 sm:px-0 md:pb-6 pb-[env(safe-area-inset-bottom)] overscroll-contain" role="region" aria-label="Authentication form">
            <div className="space-y-6">
          {/* Back button for non-signin modes */}
          {mode !== "signin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode("signin");
                setSigninError(""); // Clear errors when switching modes
              }}
              className="self-start mb-4 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl px-4 py-2 transition-all duration-300"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          )}

          {/* Sign In Form */}
          {mode === "signin" && (
            <Form {...signinForm}>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormField
                  control={signinForm.control}
                  name="loginValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2 text-primary" />
                        Email, Username, or Phone
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            {...field}
                            placeholder="Enter your email, username, or phone"
                            className="h-14 px-6 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm focus:border-primary/60 focus:bg-black group-hover:border-border/60 text-base placeholder:text-muted-foreground/60 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                            data-testid="input-login-credential"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signinForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-foreground mb-3 flex items-center">
                        <Key className="w-4 h-4 mr-2 text-primary" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pr-14 h-14 px-6 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm focus:border-primary/60 focus:bg-black group-hover:border-border/60 text-base placeholder:text-muted-foreground/60 transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-5 flex items-center text-muted-foreground hover:text-primary transition-colors duration-200 group-focus-within:text-primary"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-destructive font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signinForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-5 rounded-2xl bg-gradient-to-r from-accent/20 via-accent/30 to-accent/20 border border-border/20 hover:border-border/40 transition-all duration-300 hover:shadow-md">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-remember-me"
                          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer hover:text-primary transition-colors">
                          Remember me for 30 days
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">Stay signed in on this device</p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Sign-in Error Display */}
                {signinError && (
                  <div className="p-5 bg-gradient-to-r from-destructive/10 via-destructive/15 to-destructive/10 border-2 border-destructive/30 rounded-2xl backdrop-blur-sm animate-fade-in shadow-lg shadow-destructive/5" data-testid="signin-error">
                    <p className="text-sm text-destructive font-medium flex items-center gap-2">
                      <X className="h-4 w-4 flex-shrink-0" />
                      {signinError}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-white border-0 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:hover:translate-y-0 disabled:opacity-60"
                  size="lg"
                  data-testid="button-signin"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Sign Up Form */}
          {mode === "signup" && (
            <Form {...signupForm}>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                      <AvatarImage src={profilePhotoPreview || ""} />
                      <AvatarFallback>
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full p-2"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-photo"
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                    data-testid="input-profile-photo"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Upload your profile photo (optional)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={signupForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" data-testid="input-firstname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" data-testid="input-lastname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="john.doe@example.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signupForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="johndoe"
                          data-testid="input-username"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="+1234567890"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormDescription>
                        Use E.164 format (e.g., +15551234567)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pr-10"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {/* Password Strength Indicator */}
                      {signupForm.watch('password') && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Password Strength:</span>
                            <span className={`font-medium ${calculatePasswordStrength(signupForm.watch('password')).color}`}>
                              {calculatePasswordStrength(signupForm.watch('password')).label}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-2 w-full rounded-full ${
                                  level <= calculatePasswordStrength(signupForm.watch('password')).score
                                    ? level === 1
                                      ? 'bg-red-500'
                                      : level === 2
                                      ? 'bg-yellow-500'
                                      : level === 3
                                      ? 'bg-blue-500'
                                      : 'bg-green-500'
                                    : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div className={`flex items-center ${signupForm.watch('password')?.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {signupForm.watch('password')?.length >= 8 ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                8+ characters
                              </div>
                              <div className={`flex items-center ${/[A-Z]/.test(signupForm.watch('password') || '') ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {/[A-Z]/.test(signupForm.watch('password') || '') ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                Uppercase
                              </div>
                              <div className={`flex items-center ${/[a-z]/.test(signupForm.watch('password') || '') ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {/[a-z]/.test(signupForm.watch('password') || '') ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                Lowercase
                              </div>
                              <div className={`flex items-center ${/[0-9]/.test(signupForm.watch('password') || '') ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {/[0-9]/.test(signupForm.watch('password') || '') ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                Number
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signupForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pr-10"
                            data-testid="input-confirm-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  data-testid="button-signup"
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot-password" && (
            <Form {...forgotPasswordForm}>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormField
                  control={forgotPasswordForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email, Username, or Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            {...field}
                            placeholder="Enter your email, username, or phone"
                            className="pl-10"
                            data-testid="input-forgot-identifier"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  data-testid="button-send-reset"
                  disabled={isLoading}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {isLoading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            </Form>
          )}

          {/* OTP Verification Form */}
          {mode === "otp-verification" && (
            <Form {...otpForm}>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="space-y-4">
                  <FormLabel className="text-center block text-lg font-medium">Verification Code</FormLabel>
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    Enter the 6-digit code we sent to your device
                  </p>
                  
                  {/* Individual OTP Digits */}
                  <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handleOtpPaste}>
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
                        className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg font-bold border-2 border-border rounded-xl bg-black backdrop-blur-sm focus:border-primary focus:bg-black focus:shadow-lg focus:shadow-primary/10 transition-all duration-300 hover:border-border/60"
                        data-testid={`input-otp-digit-${index}`}
                      />
                    ))}
                  </div>

                  {/* Resend Code Button */}
                  <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary hover:text-primary/80 font-medium"
                      data-testid="button-resend-otp"
                    >
                      Resend Code
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-xl transition-all duration-300"
                  size="lg"
                  data-testid="button-verify-otp"
                  disabled={isLoading || otpDigits.some(digit => !digit)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Reset Password Form */}
          {mode === "reset-password" && (
            <Form {...resetPasswordForm}>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormField
                  control={resetPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            className="pr-10"
                            data-testid="input-new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            data-testid="button-toggle-new-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your new password"
                            className="pr-10"
                            data-testid="input-confirm-new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            data-testid="button-toggle-confirm-new-password"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  data-testid="button-reset-password"
                  disabled={isLoading}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}

          {/* Sign In Modal Footer */}
          {mode === "signin" && (
            <div className="space-y-4">
              {/* Forgot Password Link */}
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setMode("forgot-password");
                    setSigninError(""); // Clear errors when switching modes
                  }}
                  className="text-sm text-primary hover:text-primary/80"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </Button>
              </div>

              {/* Create Account Link */}
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <Button
                  variant="link"
                  onClick={() => {
                    setMode("signup");
                    setSigninError(""); // Clear errors when switching modes
                  }}
                  className="text-sm text-primary hover:text-primary/80 p-0"
                  data-testid="link-create-account"
                >
                  Create Account
                </Button>
              </div>

              {/* Social Authentication */}
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-medium">
                    <span className="bg-gradient-to-r from-background via-background to-background px-6 py-2 rounded-full text-muted-foreground/80 border border-border/30 shadow-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("Google")}
                    className="justify-center h-14 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm hover:bg-black hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group"
                    data-testid="button-google-auth"
                  >
                    <FaGoogle className="mr-3 h-5 w-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-foreground">Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("Facebook")}
                    className="justify-center h-14 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm hover:bg-black hover:border-blue-600/40 hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-300 group"
                    data-testid="button-facebook-auth"
                  >
                    <FaFacebook className="mr-3 h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-foreground">Facebook</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("X")}
                    className="justify-center h-14 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm hover:bg-black hover:border-gray-500/40 hover:shadow-lg hover:shadow-gray-500/10 transition-all duration-300 group"
                    data-testid="button-x-auth"
                  >
                    <FaTwitter className="mr-3 h-5 w-5 text-gray-800 dark:text-gray-200 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-foreground">X</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("GitHub")}
                    className="justify-center h-14 rounded-2xl border-2 border-border/30 bg-black backdrop-blur-sm hover:bg-black hover:border-gray-700/40 hover:shadow-lg hover:shadow-gray-700/10 transition-all duration-300 group"
                    data-testid="button-github-auth"
                  >
                    <FaGithub className="mr-3 h-5 w-5 text-gray-800 dark:text-gray-200 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium text-foreground">GitHub</span>
                  </Button>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center text-xs text-muted-foreground p-4 rounded-xl bg-accent/10 border border-border/10">
                <p>
                  By signing in, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-all duration-200" data-testid="link-terms">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-all duration-200" data-testid="link-privacy">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Sign Up Modal Footer */}
          {mode === "signup" && (
            <div className="space-y-4">
              {/* Terms and Privacy */}
              <div className="text-center text-xs text-muted-foreground p-4 rounded-xl bg-accent/10 border border-border/10">
                <p>
                  By creating an account, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-all duration-200" data-testid="link-terms">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-all duration-200" data-testid="link-privacy">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}