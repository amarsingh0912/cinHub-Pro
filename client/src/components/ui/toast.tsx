import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-3 sm:p-4 md:p-6 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] lg:max-w-[480px] gap-3 focus:outline-none",
      className
    )}
    aria-label="Notifications"
    role="region"
    aria-live="polite"
    aria-atomic="false"
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start overflow-hidden rounded-xl border p-6 pr-10 shadow-2xl backdrop-blur-lg transition-all duration-700 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=open]:scale-100 data-[state=open]:animate-pulse-in data-[state=closed]:scale-95",
  {
    variants: {
      variant: {
        default: "border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/95 via-white/90 to-blue-100/95 dark:from-blue-950/95 dark:via-background/90 dark:to-blue-900/95 text-blue-900 dark:text-blue-100 shadow-blue-500/30 dark:shadow-blue-400/20",
        success: "border-green-200/40 dark:border-green-800/40 bg-gradient-to-br from-green-50/95 via-white/90 to-green-100/95 dark:from-green-950/95 dark:via-background/90 dark:to-green-900/95 text-green-900 dark:text-green-100 shadow-green-500/30 dark:shadow-green-400/20",
        destructive: "border-red-200/40 dark:border-red-800/40 bg-gradient-to-br from-red-50/95 via-white/90 to-red-100/95 dark:from-red-950/95 dark:via-background/90 dark:to-red-900/95 text-red-900 dark:text-red-100 shadow-red-500/30 dark:shadow-red-400/20",
        warning: "border-amber-200/40 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/95 via-white/90 to-amber-100/95 dark:from-amber-950/95 dark:via-background/90 dark:to-amber-900/95 text-amber-900 dark:text-amber-100 shadow-amber-500/30 dark:shadow-amber-400/20",
        info: "border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/95 via-white/90 to-blue-100/95 dark:from-blue-950/95 dark:via-background/90 dark:to-blue-900/95 text-blue-900 dark:text-blue-100 shadow-blue-500/30 dark:shadow-blue-400/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  const ariaLabel = React.useMemo(() => {
    switch (variant) {
      case "success": return "Success notification"
      case "destructive": return "Error notification"
      case "warning": return "Warning notification"
      case "info": return "Information notification"
      default: return "Notification"
    }
  }, [variant])

  const ariaLive = React.useMemo(() => {
    // Use assertive for critical notifications, polite for others
    return variant === "destructive" || variant === "warning" ? "assertive" : "polite"
  }, [variant])

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      aria-label={ariaLabel}
      role="alert"
      aria-live={ariaLive}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

// Toast Icon Component with Enhanced Styling and Accessibility
const getToastIcon = (variant: "default" | "success" | "destructive" | "warning" | "info") => {
  const baseClasses = "h-6 w-6 shrink-0 drop-shadow-sm"
  
  switch (variant) {
    case "success":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 ring-4 ring-green-50 dark:ring-green-900/10">
          <CheckCircle className={cn(baseClasses, "text-green-600 dark:text-green-400")} aria-hidden="true" />
        </div>
      )
    case "destructive":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 ring-4 ring-red-50 dark:ring-red-900/10">
          <AlertCircle className={cn(baseClasses, "text-red-600 dark:text-red-400")} aria-hidden="true" />
        </div>
      )
    case "warning":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20 ring-4 ring-amber-50 dark:ring-amber-900/10">
          <AlertTriangle className={cn(baseClasses, "text-amber-600 dark:text-amber-400")} aria-hidden="true" />
        </div>
      )
    case "info":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10">
          <Info className={cn(baseClasses, "text-blue-600 dark:text-blue-400")} aria-hidden="true" />
        </div>
      )
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 ring-4 ring-blue-50 dark:ring-blue-900/10">
          <Info className={cn(baseClasses, "text-blue-600 dark:text-blue-400")} aria-hidden="true" />
        </div>
      )
  }
}

// Enhanced Toast Progress Bar Component
const ToastProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    progress?: number
    variant?: "default" | "success" | "destructive" | "warning" | "info"
  }
>(({ className, progress = 0, variant = "default", ...props }, ref) => {
  const progressColors = {
    default: "from-blue-400 to-blue-600",
    success: "from-green-400 to-green-600", 
    destructive: "from-red-400 to-red-600",
    warning: "from-amber-400 to-amber-600",
    info: "from-blue-400 to-blue-600"
  }
  
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "h-full bg-gradient-to-r rounded-full transition-all duration-300 ease-out shadow-sm",
          progressColors[variant],
          className
        )}
        style={{ 
          width: `${progress}%`,
          transform: `translateX(${progress - 100}%)`,
          transformOrigin: 'left'
        }}
        {...props}
      />
      <div className="absolute inset-0 bg-black/5 dark:bg-white/5" />
    </div>
  )
})
ToastProgress.displayName = "ToastProgress"

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-foreground/60 opacity-0 transition-all duration-300 hover:text-foreground hover:bg-black/10 hover:scale-110 dark:hover:bg-white/10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base font-semibold leading-tight tracking-tight mb-1", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-85 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastProgress,
  getToastIcon,
}
