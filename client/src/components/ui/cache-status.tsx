import { Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";

export interface CacheStatusProps {
  isOptimizing?: boolean;
  isCompleted?: boolean;
  isFailed?: boolean;
  progress?: string | null;
  error?: string | null;
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}

export function CacheStatus({
  isOptimizing,
  isCompleted,
  isFailed,
  progress,
  error,
  className,
  showDetails = false,
  onRetry
}: CacheStatusProps) {
  if (!isOptimizing && !isCompleted && !isFailed) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="cache-status">
      {isOptimizing && (
        <Badge variant="secondary" className="animate-pulse" data-testid="status-optimizing">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Optimizing images...
        </Badge>
      )}
      
      {isCompleted && (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="status-completed">
          <CheckCircle className="w-3 h-3 mr-1" />
          Images optimized
        </Badge>
      )}
      
      {isFailed && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" data-testid="status-failed">
            <XCircle className="w-3 h-3 mr-1" />
            Optimization failed
          </Badge>
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry}
              data-testid="button-retry"
            >
              Retry
            </Button>
          )}
        </div>
      )}
      
      {showDetails && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {progress && (
            <div className="flex items-center gap-1" data-testid="progress-text">
              <Info className="w-3 h-3" />
              {progress}
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-1 text-destructive" data-testid="error-text">
              <XCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}