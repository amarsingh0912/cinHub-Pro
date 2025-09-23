import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Phone, User, LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInSchema, signUpSchema } from "@shared/schema";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form schemas for sign in and sign up
const signinFormSchema = signInSchema;

const signupFormSchema = signUpSchema.extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInFormData = z.infer<typeof signinFormSchema>;
type SignUpFormData = z.infer<typeof signupFormSchema>;

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const signinForm = useForm<SignInFormData>({
    resolver: zodResolver(signinFormSchema),
    mode: "onChange",
    defaultValues: {
      loginType: "email" as const,
      loginValue: "",
      password: "",
    },
  });

  const signupForm = useForm<SignUpFormData>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const currentForm = mode === "signin" ? signinForm : signupForm;

  const loginType = signinForm.watch("loginType");

  // Reset form when login type changes and trigger immediate validation
  const handleLoginTypeChange = (newType: "email" | "username" | "phone") => {
    signinForm.setValue("loginType", newType, { shouldValidate: true });
    signinForm.setValue("loginValue", "", { shouldValidate: true });
    signinForm.setValue("password", "", { shouldValidate: true });
    // Trigger validation for instant feedback on form validity
    signinForm.trigger(["loginValue", "password"]);
  };

  const signinMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      const { confirmPassword, ...signupData } = data;
      const response = await apiRequest("POST", "/api/auth/signup", signupData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Sign up failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    if (mode === "signin") {
      const isValid = await signinForm.trigger();
      if (!isValid) return;
      signinMutation.mutate(signinForm.getValues());
    } else {
      const isValid = await signupForm.trigger();
      if (!isValid) return;
      signupMutation.mutate(signupForm.getValues());
    }
  };

  const isLoading = signinMutation.isPending || signupMutation.isPending;

  const getInputIcon = () => {
    switch (loginType) {
      case "email":
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      case "phone":
        return <Phone className="h-4 w-4 text-muted-foreground" />;
      case "username":
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInputPlaceholder = () => {
    switch (loginType) {
      case "email":
        return "Enter your email address";
      case "phone":
        return "Enter your phone number (+1234567890)";
      case "username":
        return "Enter your username";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="signin-modal">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-display font-bold mb-2">
            {mode === "signin" ? "Welcome Back" : "Join CineHub Pro"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "signin" 
              ? "Sign in to access your personalized movie experience, create watchlists, and get recommendations."
              : "Create your account to start building watchlists, writing reviews, and discovering great content."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Mode Toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-signin"
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-signup"
            >
              Sign Up
            </button>
          </div>


          {/* Forms */}
          <div className="space-y-4">
            {mode === "signin" && (
              <>
                {/* Login Type Selector for Sign In */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <button
                    onClick={() => handleLoginTypeChange("email")}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      loginType === "email"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="button-login-type-email"
                  >
                    Email
                  </button>
                  <button
                    onClick={() => handleLoginTypeChange("username")}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      loginType === "username"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="button-login-type-username"
                  >
                    Username
                  </button>
                  <button
                    onClick={() => handleLoginTypeChange("phone")}
                    className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      loginType === "phone"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="button-login-type-phone"
                  >
                    Phone
                  </button>
                </div>
              </>
            )}

            {mode === "signin" ? (
              <Form {...signinForm}>
                <form className="space-y-4">
                  {/* Hidden field for loginType to be part of form data */}
                  <FormField
                    control={signinForm.control}
                    name="loginType"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <input {...field} type="hidden" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signinForm.control}
                    name="loginValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="capitalize">{loginType}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              {getInputIcon()}
                            </div>
                            <Input
                              {...field}
                              type={loginType === "email" ? "email" : loginType === "phone" ? "tel" : "text"}
                              placeholder={getInputPlaceholder()}
                              className="pl-10"
                              data-testid="input-login-credential"
                            />
                          </div>
                        </FormControl>
                        {loginType === "phone" && (
                          <FormDescription>
                            Please use E.164 format (e.g., +15551234567)
                          </FormDescription>
                        )}
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
                </form>
              </Form>
            ) : (
              <Form {...signupForm}>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                </form>
              </Form>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              data-testid={mode === "signin" ? "button-signin" : "button-signup"}
              disabled={isLoading || !currentForm.formState.isValid}
            >
              {mode === "signin" ? (
                <LogIn className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isLoading 
                ? (mode === "signin" ? "Signing in..." : "Creating account...") 
                : (mode === "signin" ? "Sign In" : "Create Account")
              }
            </Button>
          </div>

          {/* Bottom Links */}
          <div className="space-y-4 pt-4">

            <div className="text-center text-xs text-muted-foreground">
              <p>
                By {mode === "signin" ? "signing in" : "creating an account"}, you agree to our{" "}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
