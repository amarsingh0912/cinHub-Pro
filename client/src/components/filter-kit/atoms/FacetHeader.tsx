import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacetHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export function FacetHeader({ icon: Icon, title, description, count, action, className }: FacetHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-4", className)}>
      <div className="flex items-start gap-3 flex-1">
        {Icon && (
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {count !== undefined && count > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
