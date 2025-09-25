import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn-interactive inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden active:scale-[0.98] transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] rounded-lg border border-primary/20",
        gradient: "bg-gradient-to-r from-primary to-primary-600 text-primary-foreground hover:from-primary/90 hover:to-primary-500 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] rounded-lg font-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 hover:scale-[1.02] rounded-lg border border-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 hover:shadow-md hover:scale-[1.02] rounded-lg backdrop-blur-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg hover:shadow-secondary/25 hover:scale-[1.02] rounded-lg border border-secondary/20",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] rounded-lg backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 px-0 h-auto rounded-none",
        glass: "glassmorphism text-foreground hover:bg-white/10 border border-white/10 rounded-xl hover:scale-[1.02] backdrop-blur-lg",
        premium: "bg-gradient-to-r from-primary via-primary-500 to-secondary text-white hover:from-primary/90 hover:via-primary-400 hover:to-secondary/90 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] rounded-xl font-semibold border border-primary/30",
        success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 hover:scale-[1.02] rounded-lg border border-success/20",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/25 hover:scale-[1.02] rounded-lg border border-warning/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
