import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Film, Tv } from "lucide-react";

interface SegmentedToggleOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface SegmentedToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedToggleOption[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  showCounts?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
}

export const SegmentedToggle = ({
  value,
  onValueChange,
  options,
  className,
  size = 'md',
  variant = 'premium',
  showCounts = false,
  disabled = false,
  'data-testid': testId
}: SegmentedToggleProps) => {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [focusedValue, setFocusedValue] = useState<string | null>(null);

  // Find current option index for animation positioning
  const selectedIndex = options.findIndex(option => option.value === value);

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  const variantClasses = {
    default: 'bg-background/80 border border-border/50',
    premium: 'glass-panel border-white/10',
    minimal: 'bg-muted/30 border-0'
  };

  return (
    <div
      className={cn(
        "relative inline-flex rounded-xl p-1",
        "backdrop-blur-sm transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      data-testid={testId}
      role="radiogroup"
      aria-label="Content type selection"
    >
      {/* Animated background indicator */}
      <AnimatePresence mode="wait">
        {selectedIndex !== -1 && (
          <motion.div
            className={cn(
              "absolute top-1 bottom-1 rounded-lg",
              "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
              "border border-primary/20 shadow-lg",
              "backdrop-blur-sm"
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: `${selectedIndex * 100}%`,
              width: `${100 / options.length}%`
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            layoutId="segmented-toggle-indicator"
          />
        )}
      </AnimatePresence>

      {/* Hover indicator */}
      <AnimatePresence>
        {hoveredValue && hoveredValue !== value && (
          <motion.div
            className={cn(
              "absolute top-1 bottom-1 rounded-lg",
              "bg-primary/5 border border-primary/10"
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: `${options.findIndex(opt => opt.value === hoveredValue) * 100}%`,
              width: `${100 / options.length}%`
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Options */}
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isHovered = hoveredValue === option.value;
        const isFocused = focusedValue === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-testid={`toggle-option-${option.value}`}
            disabled={disabled}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2",
              "rounded-lg border-0 bg-transparent transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              size === 'sm' && "px-3 py-1",
              size === 'md' && "px-4 py-2",
              size === 'lg' && "px-6 py-3"
            )}
            style={{ zIndex: isSelected ? 3 : isHovered ? 2 : 1 }}
            onClick={() => !disabled && onValueChange(option.value)}
            onMouseEnter={() => !disabled && setHoveredValue(option.value)}
            onMouseLeave={() => setHoveredValue(null)}
            onFocus={() => setFocusedValue(option.value)}
            onBlur={() => setFocusedValue(null)}
          >
            {/* Icon */}
            {option.icon && (
              <motion.div
                animate={{
                  scale: isSelected ? 1.1 : 1,
                  color: isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                }}
                transition={{ duration: 0.2 }}
              >
                <option.icon 
                  className={cn(
                    "transition-all duration-200",
                    size === 'sm' && "w-3 h-3",
                    size === 'md' && "w-4 h-4", 
                    size === 'lg' && "w-5 h-5"
                  )}
                />
              </motion.div>
            )}

            {/* Label */}
            <motion.span
              className={cn(
                "font-medium transition-all duration-200",
                isSelected 
                  ? "text-primary" 
                  : isHovered || isFocused
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
              animate={{
                fontWeight: isSelected ? 600 : 500
              }}
              transition={{ duration: 0.2 }}
            >
              {option.label}
            </motion.span>

            {/* Count badge */}
            {showCounts && option.count !== undefined && (
              <motion.span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium",
                  "transition-all duration-200",
                  isSelected
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                )}
                animate={{
                  scale: isSelected ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                {option.count.toLocaleString()}
              </motion.span>
            )}

            {/* Selection indicator glow */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
};

// Content type specific component
export const ContentTypeToggle = ({
  value,
  onValueChange,
  className,
  movieCount,
  tvCount,
  ...props
}: Omit<SegmentedToggleProps, 'options'> & {
  movieCount?: number;
  tvCount?: number;
}) => {
  const options: SegmentedToggleOption[] = [
    {
      value: 'movie',
      label: 'Movies',
      icon: Film,
      count: movieCount
    },
    {
      value: 'tv',
      label: 'TV Shows', 
      icon: Tv,
      count: tvCount
    }
  ];

  return (
    <SegmentedToggle
      value={value}
      onValueChange={onValueChange}
      options={options}
      className={className}
      {...props}
    />
  );
};

// Preset configurations
export const SegmentedTogglePresets = {
  contentType: (props: Pick<SegmentedToggleProps, 'value' | 'onValueChange'>) => (
    <ContentTypeToggle
      {...props}
      size="md"
      variant="premium"
      showCounts={false}
      data-testid="content-type-toggle"
    />
  ),

  sortOrder: (props: Pick<SegmentedToggleProps, 'value' | 'onValueChange'>) => (
    <SegmentedToggle
      {...props}
      options={[
        { value: 'asc', label: 'Ascending' },
        { value: 'desc', label: 'Descending' }
      ]}
      size="sm"
      variant="minimal"
      data-testid="sort-order-toggle"
    />
  ),

  viewMode: (props: Pick<SegmentedToggleProps, 'value' | 'onValueChange'>) => (
    <SegmentedToggle
      {...props}
      options={[
        { value: 'grid', label: 'Grid' },
        { value: 'list', label: 'List' }
      ]}
      size="sm"
      variant="default"
      data-testid="view-mode-toggle"
    />
  )
};

export default SegmentedToggle;