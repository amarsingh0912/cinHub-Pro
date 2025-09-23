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
import { Eye, EyeOff, Mail, Phone, User, LogIn } from "lucide-react";
import { FaGoogle, FaGithub, FaTwitter, FaApple } from "react-icons/fa";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create discriminated union schema for all login types
const formSchema = z.discriminatedUnion("loginType", [
  z.object({
    loginType: z.literal("email"),
    loginValue: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  z.object({
    loginType: z.literal("phone"),
    loginValue: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format (e.g., +15551234567)"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  z.object({
    loginType: z.literal("username"),
    loginValue: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
]);

type FormData = z.infer<typeof formSchema>;

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      loginType: "email" as const,
      loginValue: "",
      password: "",
    },
  });

  const loginType = form.watch("loginType");

  // Reset form when login type changes and trigger immediate validation
  const handleLoginTypeChange = (newType: "email" | "username" | "phone") => {
    form.setValue("loginType", newType, { shouldValidate: true });
    form.setValue("loginValue", "", { shouldValidate: true });
    form.setValue("password", "", { shouldValidate: true });
    // Trigger validation for instant feedback on form validity
    form.trigger(["loginValue", "password"]);
  };

  const handleSignIn = async () => {
    // Trigger validation before redirecting
    const isValid = await form.trigger();
    if (!isValid) {
      return; // Don't redirect if form has validation errors
    }
    
    setIsLoading(true);
    // All authentication goes through Replit Auth regardless of the form data
    window.location.href = "/api/login";
  };

  const handleForgotPassword = () => {
    // Redirect to sign-in page - the provider handles password reset
    window.location.href = "/api/login";
  };

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
            Welcome to CineHub Pro
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in to access your personalized movie experience, create watchlists, and get recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Direct Sign-In Button */}
          <Button
            onClick={handleSignIn}
            className="w-full"
            size="lg"
            data-testid="button-signin-replit"
            disabled={isLoading || !form.formState.isValid}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Preview your credentials</span>
            </div>
          </div>

          {/* Login Type Selector */}
          <div className="space-y-3">
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

            {/* Form with Validation */}
            <Form {...form}>
              <form className="space-y-4">
                {/* Hidden field for loginType to be part of form data */}
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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

                <div className="text-right space-y-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:text-primary/80"
                    data-testid="link-forgot-password"
                  >
                    Forgot password?
                  </button>
                  <div className="text-xs text-muted-foreground text-left bg-muted/50 p-2 rounded">
                    💡 Password recovery is handled by your chosen provider (Google, GitHub, etc.) on the next page.
                  </div>
                </div>
              </form>
            </Form>

            <div className="text-center text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p>
                Note: This form validates your credentials format. When you click "Sign In" above, 
                you'll be redirected to the secure authentication page to complete sign-in.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Supported providers</span>
            </div>
          </div>

          {/* Supported Providers Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FaGoogle className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Google</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FaGithub className="h-4 w-4 text-gray-700" />
              <span className="text-sm text-muted-foreground">GitHub</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FaTwitter className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Twitter</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <FaApple className="h-4 w-4 text-gray-800" />
              <span className="text-sm text-muted-foreground">Apple</span>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={handleSignIn}
                  className="text-primary hover:text-primary/80 font-medium"
                  data-testid="link-create-account"
                >
                  Create one now
                </button>
              </p>
            </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
