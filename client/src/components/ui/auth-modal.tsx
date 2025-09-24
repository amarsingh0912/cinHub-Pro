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
  ArrowLeft
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

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<ModalMode>("signin");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string>("");
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'reset'>('signup');
  const [signinError, setSigninError] = useState<string>("");
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
      <DialogContent className="w-[min(100vw-2rem,28rem)] sm:w-[32rem] md:w-[36rem] p-0 sm:p-4 md:p-6 sm:rounded-xl overflow-hidden" data-testid="auth-modal">
        <div className="flex flex-col max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[90dvh]">
          <DialogHeader className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 md:px-6 md:pt-0">
            <DialogTitle className="text-center text-xl sm:text-2xl font-display font-bold mb-2">
              {getModalTitle()}
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
              {getModalDescription()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 md:pb-4 pb-[env(safe-area-inset-bottom)] overscroll-contain" role="region" aria-label="Authentication form">
            <div className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
          {/* Back button for non-signin modes */}
          {mode !== "signin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMode("signin");
                setSigninError(""); // Clear errors when switching modes
              }}
              className="self-start -ml-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          )}

          {/* Sign In Form */}
          {mode === "signin" && (
            <Form {...signinForm}>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormField
                  control={signinForm.control}
                  name="loginValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email, Username, or Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input
                            {...field}
                            placeholder="Enter your email, username, or phone"
                            className="pl-10"
                            data-testid="input-login-credential"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signinForm.control}
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={signinForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-remember-me"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Remember me for 30 days
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Sign-in Error Display */}
                {signinError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md" data-testid="signin-error">
                    <p className="text-sm text-destructive font-medium">{signinError}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  data-testid="button-signin"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? "Signing in..." : "Sign In"}
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
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center text-lg tracking-widest"
                          data-testid="input-otp"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  data-testid="button-verify-otp"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
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
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("Google")}
                    className="justify-start sm:justify-center"
                    data-testid="button-google-auth"
                  >
                    <FaGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("Facebook")}
                    className="justify-start sm:justify-center"
                    data-testid="button-facebook-auth"
                  >
                    <FaFacebook className="mr-2 h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("X")}
                    className="justify-start sm:justify-center"
                    data-testid="button-x-auth"
                  >
                    <FaTwitter className="mr-2 h-4 w-4" />
                    X
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth("GitHub")}
                    className="justify-start sm:justify-center"
                    data-testid="button-github-auth"
                  >
                    <FaGithub className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center text-xs text-muted-foreground">
                <p>
                  By signing in, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-primary hover:text-primary/80" data-testid="link-terms">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:text-primary/80" data-testid="link-privacy">
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
              <div className="text-center text-xs text-muted-foreground">
                <p>
                  By creating an account, you agree to our{" "}
                  <Link href="/terms-of-service" className="text-primary hover:text-primary/80" data-testid="link-terms">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:text-primary/80" data-testid="link-privacy">
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