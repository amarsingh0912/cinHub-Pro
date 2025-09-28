import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription, AlertWithIcon } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Info, AlertCircle, Bell, Sparkles } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function NotificationsDemo() {
  const { toast } = useToast();
  const [toastCount, setToastCount] = useState(0);

  const showToast = (variant: "default" | "success" | "destructive" | "warning" | "info", withAction = false) => {
    const toastId = `toast-${Date.now()}`;
    setToastCount(prev => prev + 1);
    
    const toastMessages = {
      default: {
        title: "Default Notification",
        description: "This is a default notification with beautiful styling and smooth animations."
      },
      success: {
        title: "Success!",
        description: "Your action was completed successfully. Everything is working perfectly."
      },
      destructive: {
        title: "Error Occurred",
        description: "Something went wrong. Please try again or contact support if the issue persists."
      },
      warning: {
        title: "Warning",
        description: "Please review your settings. Some actions may not work as expected."
      },
      info: {
        title: "Information",
        description: "Here's some useful information you should know about this feature."
      }
    };

    toast({
      title: toastMessages[variant].title,
      description: toastMessages[variant].description,
      variant,
      duration: withAction ? 0 : 6000, // No auto-dismiss if there's an action
      action: withAction ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast({
              title: "Action Clicked!",
              description: "You clicked the action button.",
              variant: "success",
              duration: 3000,
            });
          }}
          data-testid="toast-action-button"
        >
          Action
        </Button>
      ) : undefined,
    });
  };

  const showMultipleToasts = () => {
    const variants: Array<"success" | "info" | "warning" | "destructive"> = ["success", "info", "warning", "destructive"];
    variants.forEach((variant, index) => {
      setTimeout(() => {
        showToast(variant);
      }, index * 300);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="notifications-demo-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Bell className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Enhanced Notifications</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient">
                Beautiful Notifications
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Experience our enhanced notification system with modern design, smooth animations, 
                and improved accessibility features.
              </p>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm">
                  <Sparkles className="h-4 w-4" />
                  Modern Design
                </span>
                <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Accessible
                </span>
                <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                  <Info className="h-4 w-4" />
                  Responsive
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Toast Notifications Demo */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Toast Notifications</h2>
              <p className="text-muted-foreground">
                Enhanced toast notifications with beautiful animations, progress indicators, and improved accessibility.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Success Toast
                  </CardTitle>
                  <CardDescription>
                    Celebrate successful actions with vibrant feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => showToast("success")}
                    className="w-full"
                    data-testid="button-show-success-toast"
                  >
                    Show Success
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Error Toast
                  </CardTitle>
                  <CardDescription>
                    Clear error messaging with helpful context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => showToast("destructive")}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-show-error-toast"
                  >
                    Show Error
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Warning Toast
                  </CardTitle>
                  <CardDescription>
                    Important warnings that demand attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => showToast("warning")}
                    variant="outline"
                    className="w-full"
                    data-testid="button-show-warning-toast"
                  >
                    Show Warning
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Info Toast
                  </CardTitle>
                  <CardDescription>
                    Helpful information and tips for users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => showToast("info")}
                    variant="outline"
                    className="w-full"
                    data-testid="button-show-info-toast"
                  >
                    Show Info
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-600" />
                    With Action
                  </CardTitle>
                  <CardDescription>
                    Interactive toasts with action buttons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => showToast("info", true)}
                    variant="outline"
                    className="w-full"
                    data-testid="button-show-action-toast"
                  >
                    Show with Action
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Multiple Toasts
                  </CardTitle>
                  <CardDescription>
                    See how multiple toasts stack beautifully
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={showMultipleToasts}
                    variant="outline"
                    className="w-full"
                    data-testid="button-show-multiple-toasts"
                  >
                    Show Multiple
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Total toasts shown: <span className="font-semibold" data-testid="toast-counter">{toastCount}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Alert Components Demo */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Alert Components</h2>
              <p className="text-muted-foreground">
                Enhanced alert components with improved styling and new variants.
              </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              <AlertWithIcon variant="success" data-testid="alert-success">
                <AlertTitle>Success Alert</AlertTitle>
                <AlertDescription>
                  This is a success alert with beautiful gradient background and enhanced icon styling.
                  Perfect for confirming successful operations.
                </AlertDescription>
              </AlertWithIcon>

              <AlertWithIcon variant="info" data-testid="alert-info">
                <AlertTitle>Information Alert</AlertTitle>
                <AlertDescription>
                  This information alert helps users understand important details about the current context
                  or provides helpful tips and guidance.
                </AlertDescription>
              </AlertWithIcon>

              <AlertWithIcon variant="warning" data-testid="alert-warning">
                <AlertTitle>Warning Alert</AlertTitle>
                <AlertDescription>
                  This warning alert draws attention to important information that users should be aware of
                  before proceeding with their current action.
                </AlertDescription>
              </AlertWithIcon>

              <AlertWithIcon variant="destructive" data-testid="alert-destructive">
                <AlertTitle>Destructive Alert</AlertTitle>
                <AlertDescription>
                  This error alert clearly communicates when something has gone wrong and provides
                  context about the issue and potential next steps.
                </AlertDescription>
              </AlertWithIcon>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Enhanced Features</h2>
              <p className="text-muted-foreground">
                Our notification system comes packed with modern features and improvements.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smooth Animations</h3>
                <p className="text-muted-foreground">
                  Beautiful entrance and exit animations with perfect timing and easing curves.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Accessibility First</h3>
                <p className="text-muted-foreground">
                  Screen reader friendly with proper ARIA labels and keyboard navigation support.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Info className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Responsive Design</h3>
                <p className="text-muted-foreground">
                  Optimized for all screen sizes with adaptive spacing and positioning.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}