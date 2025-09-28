import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border p-6 shadow-lg transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/90 via-white/80 to-blue-100/90 dark:from-blue-950/90 dark:via-background/80 dark:to-blue-900/90 text-blue-900 dark:text-blue-100",
        success: "border-green-200/40 dark:border-green-800/40 bg-gradient-to-br from-green-50/90 via-white/80 to-green-100/90 dark:from-green-950/90 dark:via-background/80 dark:to-green-900/90 text-green-900 dark:text-green-100",
        destructive: "border-red-200/40 dark:border-red-800/40 bg-gradient-to-br from-red-50/90 via-white/80 to-red-100/90 dark:from-red-950/90 dark:via-background/80 dark:to-red-900/90 text-red-900 dark:text-red-100",
        warning: "border-amber-200/40 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/90 via-white/80 to-amber-100/90 dark:from-amber-950/90 dark:via-background/80 dark:to-amber-900/90 text-amber-900 dark:text-amber-100",
        info: "border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/90 via-white/80 to-blue-100/90 dark:from-blue-950/90 dark:via-background/80 dark:to-blue-900/90 text-blue-900 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    data-testid={`alert-${variant || "default"}`}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-2 font-semibold leading-tight tracking-tight text-base", className)}
    data-testid="alert-title"
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed [&_p]:leading-relaxed", className)}
    data-testid="alert-description"
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Alert Icon Component with Accessibility
const getAlertIcon = (variant: "default" | "success" | "destructive" | "warning" | "info") => {
  const baseClasses = "h-5 w-5 shrink-0"
  
  switch (variant) {
    case "success":
      return <CheckCircle className={cn(baseClasses, "text-green-600 dark:text-green-400")} aria-hidden="true" />
    case "destructive":
      return <AlertCircle className={cn(baseClasses, "text-red-600 dark:text-red-400")} aria-hidden="true" />
    case "warning":
      return <AlertTriangle className={cn(baseClasses, "text-amber-600 dark:text-amber-400")} aria-hidden="true" />
    case "info":
      return <Info className={cn(baseClasses, "text-blue-600 dark:text-blue-400")} aria-hidden="true" />
    default:
      return <Info className={cn(baseClasses, "text-blue-600 dark:text-blue-400")} aria-hidden="true" />
  }
}

// Enhanced Alert Component with Icon
const AlertWithIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
    showIcon?: boolean
  }
>(({ className, variant, showIcon = true, children, ...props }, ref) => (
  <Alert ref={ref} variant={variant} className={className} {...props}>
    {showIcon && (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getAlertIcon(variant || "default")}
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    )}
    {!showIcon && children}
  </Alert>
))
AlertWithIcon.displayName = "AlertWithIcon"

export { 
  Alert, 
  AlertTitle, 
  AlertDescription, 
  AlertWithIcon,
  getAlertIcon,
  type VariantProps
}
