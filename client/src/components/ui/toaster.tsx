import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastProgress,
  getToastIcon,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, duration = 0, progress = 0, ...props }) {
        const toastVariant = variant || "default"
        
        return (
          <Toast key={id} variant={toastVariant} {...props}>
            <div className="flex items-start space-x-3 w-full">
              {/* Toast Icon */}
              <div className="flex-shrink-0 pt-0.5">
                {getToastIcon(toastVariant)}
              </div>
              
              {/* Toast Content */}
              <div className="flex-1 space-y-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              
              {/* Action */}
              {action && <div className="flex-shrink-0">{action}</div>}
            </div>
            
            {/* Progress Bar (only show if duration > 0) */}
            {duration > 0 && (
              <ToastProgress 
                progress={progress} 
                variant={toastVariant}
              />
            )}
            
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
