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
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border-l-4 p-4 pr-8 shadow-xl backdrop-blur-sm transition-all duration-500 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=open]:scale-100 data-[state=closed]:scale-95",
  {
    variants: {
      variant: {
        default: "border-l-blue-500 bg-background/95 text-foreground shadow-blue-500/20",
        success: "border-l-green-500 bg-green-50/95 dark:bg-green-950/95 text-green-900 dark:text-green-100 shadow-green-500/20",
        destructive: "border-l-red-500 bg-red-50/95 dark:bg-red-950/95 text-red-900 dark:text-red-100 shadow-red-500/20",
        warning: "border-l-amber-500 bg-amber-50/95 dark:bg-amber-950/95 text-amber-900 dark:text-amber-100 shadow-amber-500/20",
        info: "border-l-blue-500 bg-blue-50/95 dark:bg-blue-950/95 text-blue-900 dark:text-blue-100 shadow-blue-500/20",
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
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
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

// Toast Icon Component
const getToastIcon = (variant: "default" | "success" | "destructive" | "warning" | "info") => {
  const iconProps = { className: "h-5 w-5 shrink-0" }
  
  switch (variant) {
    case "success":
      return <CheckCircle {...iconProps} className={cn(iconProps.className, "text-green-600 dark:text-green-400")} />
    case "destructive":
      return <AlertCircle {...iconProps} className={cn(iconProps.className, "text-red-600 dark:text-red-400")} />
    case "warning":
      return <AlertTriangle {...iconProps} className={cn(iconProps.className, "text-amber-600 dark:text-amber-400")} />
    case "info":
      return <Info {...iconProps} className={cn(iconProps.className, "text-blue-600 dark:text-blue-400")} />
    default:
      return <Info {...iconProps} className={cn(iconProps.className, "text-blue-600 dark:text-blue-400")} />
  }
}

// Toast Progress Bar Component
const ToastProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    progress?: number
    variant?: "default" | "success" | "destructive" | "warning" | "info"
  }
>(({ className, progress = 0, variant = "default", ...props }, ref) => {
  const progressColors = {
    default: "bg-blue-500",
    success: "bg-green-500", 
    destructive: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-0 left-0 h-1 bg-black/10 dark:bg-white/10 transition-all duration-100",
        className
      )}
      style={{ width: `${100 - progress}%` }}
      {...props}
    >
      <div className={cn("h-full transition-all duration-100", progressColors[variant])} />
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
      "absolute right-2 top-2 rounded-full p-1 text-foreground/70 opacity-0 transition-all duration-200 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50 group-hover:opacity-100",
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
    className={cn("text-sm font-semibold leading-none tracking-tight", className)}
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
    className={cn("text-sm opacity-90 leading-relaxed", className)}
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
