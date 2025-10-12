import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricPillProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

const variantStyles = {
  default: "bg-muted/50 border-border/50 text-foreground",
  primary: "bg-primary/10 border-primary/20 text-primary",
  success: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
  warning: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
};

export function MetricPill({ icon: Icon, label, value, trend, variant = 'default', className }: MetricPillProps) {
  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm",
        variantStyles[variant],
        className
      )}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
      {trend && (
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          trend === 'up' && "bg-green-500",
          trend === 'down' && "bg-red-500",
          trend === 'neutral' && "bg-gray-500"
        )} />
      )}
    </motion.div>
  );
}
