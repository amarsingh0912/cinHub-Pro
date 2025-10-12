import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterMotion } from "../filter-motion";

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

const variantStyles = {
  default: {
    base: "bg-muted/50 border-border/50 text-foreground hover:bg-muted hover:border-border",
    selected: "bg-primary/10 border-primary/30 text-primary"
  },
  primary: {
    base: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
    selected: "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300"
  },
  success: {
    base: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/20",
    selected: "bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-300"
  },
  warning: {
    base: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20",
    selected: "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300"
  }
};

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base"
};

export function FilterChip({
  label,
  selected = false,
  onToggle,
  onRemove,
  variant = 'default',
  size = 'md',
  disabled = false,
  icon,
  className,
  'data-testid': testId
}: FilterChipProps) {
  const variantStyle = variantStyles[variant];
  const baseStyle = selected ? variantStyle.selected : variantStyle.base;

  return (
    <motion.button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-200",
        "backdrop-blur-sm font-medium whitespace-nowrap",
        "hover:scale-105 active:scale-95",
        sizeStyles[size],
        baseStyle,
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-testid={testId}
      {...filterMotion.chipPop}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      <AnimatePresence>
        {onRemove && selected && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="flex-shrink-0 ml-0.5 p-0.5 rounded-full hover:bg-current/10 transition-colors"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 500 }}
          >
            <X className="h-3 w-3" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
