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
          <Toast 
            key={id} 
            variant={toastVariant} 
            data-testid={`toast-${toastVariant}`}
            {...props}
          >
            <div className="flex items-start space-x-3 sm:space-x-4 w-full">
              {/* Toast Icon */}
              <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                {getToastIcon(toastVariant)}
              </div>
              
              {/* Toast Content */}
              <div className="flex-1 min-w-0 space-y-1">
                {title && (
                  <ToastTitle data-testid={`toast-title-${id}`}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription data-testid={`toast-description-${id}`}>
                    {description}
                  </ToastDescription>
                )}
              </div>
              
              {/* Action */}
              {action && (
                <div className="flex-shrink-0 ml-3 sm:ml-4">
                  {action}
                </div>
              )}
            </div>
            
            {/* Progress Bar (only show if duration > 0) */}
            {duration > 0 && (
              <ToastProgress 
                progress={progress} 
                variant={toastVariant}
                data-testid={`toast-progress-${id}`}
              />
            )}
            
            <ToastClose data-testid={`toast-close-${id}`} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
