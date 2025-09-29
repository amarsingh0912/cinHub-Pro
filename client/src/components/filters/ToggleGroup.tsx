import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  MonitorPlay, 
  Tv, 
  Film, 
  Calendar,
  MapPin,
  Zap,
  Check
} from "lucide-react";

export interface ToggleOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: any;
  count?: number;
  disabled?: boolean;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  maxSelections?: number;
  minSelections?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'cards' | 'buttons';
  orientation?: 'horizontal' | 'vertical';
  allowMultiple?: boolean;
  showCounts?: boolean;
  'data-testid'?: string;
}

export const ToggleGroup = ({
  options,
  value,
  onValueChange,
  label,
  maxSelections,
  minSelections = 0,
  className,
  size = 'md',
  variant = 'premium',
  orientation = 'horizontal',
  allowMultiple = true,
  showCounts = false,
  'data-testid': testId
}: ToggleGroupProps) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const cardSizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };

  const toggleOption = (optionId: string) => {
    const isSelected = value.includes(optionId);
    const option = options.find(opt => opt.id === optionId);
    
    if (option?.disabled) return;

    let newValue: string[];

    if (allowMultiple) {
      if (isSelected) {
        // Remove option (check minimum selections)
        if (value.length <= minSelections) return;
        newValue = value.filter(id => id !== optionId);
      } else {
        // Add option (check maximum selections)
        if (maxSelections && value.length >= maxSelections) return;
        newValue = [...value, optionId];
      }
    } else {
      // Single selection mode
      newValue = isSelected ? [] : [optionId];
    }

    onValueChange(newValue);
  };

  const isOptionSelected = (optionId: string) => value.includes(optionId);
  const isOptionDisabled = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId);
    if (option?.disabled) return true;
    
    const isSelected = isOptionSelected(optionId);
    if (!isSelected && maxSelections && value.length >= maxSelections) return true;
    if (isSelected && value.length <= minSelections) return true;
    
    return false;
  };

  const renderCard = (option: ToggleOption, index: number) => {
    const isSelected = isOptionSelected(option.id);
    const isDisabled = isOptionDisabled(option.id);
    const isHovered = hoveredOption === option.id;
    const IconComponent = option.icon;

    return (
      <motion.div
        key={option.id}
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index * 0.05
        }}
        className={cn(
          "relative cursor-pointer transition-all duration-300",
          "border-2 rounded-xl",
          cardSizeClasses[size],
          isSelected 
            ? "border-primary/50 shadow-glow bg-primary/5" 
            : isHovered
              ? "border-primary/30 shadow-md bg-primary/2"
              : "border-border/50 hover:border-border bg-background/50",
          isDisabled && "opacity-50 cursor-not-allowed",
          variant === 'premium' && "glass-panel border-white/10 backdrop-blur-sm"
        )}
        onMouseEnter={() => !isDisabled && setHoveredOption(option.id)}
        onMouseLeave={() => setHoveredOption(null)}
        onClick={() => !isDisabled && toggleOption(option.id)}
        data-testid={`toggle-option-${option.id}`}
      >
        {/* Selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 90 }}
              className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md z-10"
            >
              <Check className="w-3 h-3 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Icon */}
          {IconComponent && (
            <motion.div
              animate={{
                scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
                color: isSelected ? "hsl(var(--primary))" : "hsl(var(--foreground))"
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <IconComponent className={cn(
                "transition-all duration-200",
                size === 'sm' && "w-8 h-8",
                size === 'md' && "w-10 h-10",
                size === 'lg' && "w-12 h-12"
              )} />
            </motion.div>
          )}

          {/* Label and description */}
          <div className="space-y-1">
            <motion.div
              className={cn(
                "font-semibold transition-all duration-200",
                sizeClasses[size],
                isSelected ? "text-primary" : "text-foreground"
              )}
              animate={{
                scale: isSelected ? 1.05 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              {option.label}
            </motion.div>
            
            {option.description && (
              <div className={cn(
                "text-muted-foreground leading-relaxed",
                size === 'sm' && "text-xs",
                size === 'md' && "text-xs",
                size === 'lg' && "text-sm"
              )}>
                {option.description}
              </div>
            )}

            {/* Count badge */}
            {showCounts && option.count !== undefined && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "mt-1",
                  isSelected && "bg-primary/20 text-primary border-primary/30"
                )}
              >
                {option.count.toLocaleString()}
              </Badge>
            )}
          </div>
        </div>

        {/* Hover glow effect */}
        <AnimatePresence>
          {isHovered && !isSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-xl bg-primary/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderButton = (option: ToggleOption, index: number) => {
    const isSelected = isOptionSelected(option.id);
    const isDisabled = isOptionDisabled(option.id);
    const isHovered = hoveredOption === option.id;
    const IconComponent = option.icon;

    return (
      <motion.button
        key={option.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index * 0.03
        }}
        className={cn(
          "relative flex items-center gap-2 transition-all duration-200",
          "border border-border/50 rounded-lg",
          buttonSizeClasses[size],
          isSelected 
            ? "border-primary/50 bg-primary/10 text-primary shadow-md" 
            : isHovered
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "hover:border-border bg-background/50 text-foreground",
          isDisabled && "opacity-50 cursor-not-allowed",
          variant === 'premium' && "glass-panel border-white/10",
          "focus:outline-none focus:ring-2 focus:ring-primary/30"
        )}
        disabled={isDisabled}
        onMouseEnter={() => !isDisabled && setHoveredOption(option.id)}
        onMouseLeave={() => setHoveredOption(null)}
        onClick={() => !isDisabled && toggleOption(option.id)}
        data-testid={`toggle-option-${option.id}`}
      >
        {/* Icon */}
        {IconComponent && (
          <motion.div
            animate={{
              scale: isSelected ? 1.1 : 1,
              rotate: isSelected ? 360 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <IconComponent className={cn(
              "transition-colors duration-200",
              size === 'sm' && "w-4 h-4",
              size === 'md' && "w-5 h-5",
              size === 'lg' && "w-6 h-6"
            )} />
          </motion.div>
        )}

        {/* Label */}
        <span className="font-medium">{option.label}</span>

        {/* Count */}
        {showCounts && option.count !== undefined && (
          <Badge 
            variant="secondary" 
            className={cn(
              "ml-auto text-xs",
              isSelected && "bg-primary/30 text-primary-foreground"
            )}
          >
            {option.count.toLocaleString()}
          </Badge>
        )}

        {/* Selection indicator */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
            >
              <Check className="w-2.5 h-2.5 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div className={cn("space-y-3", className)} data-testid={testId}>
      {/* Label and selection info */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          
          <div className="flex items-center gap-2">
            {value.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {value.length}{maxSelections && `/${maxSelections}`} selected
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Options */}
      <div className={cn(
        "grid gap-3",
        variant === 'cards' && orientation === 'horizontal' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        variant === 'cards' && orientation === 'vertical' && "grid-cols-1",
        variant === 'buttons' && orientation === 'horizontal' && "grid-cols-1 sm:grid-cols-2",
        variant === 'buttons' && orientation === 'vertical' && "grid-cols-1"
      )}>
        {options.map((option, index) => {
          if (variant === 'cards') {
            return renderCard(option, index);
          } else {
            return renderButton(option, index);
          }
        })}
      </div>

      {/* Helper text */}
      {(minSelections > 0 || maxSelections) && (
        <div className="text-xs text-muted-foreground">
          {minSelections > 0 && maxSelections && (
            <>Select {minSelections}-{maxSelections} options</>
          )}
          {minSelections > 0 && !maxSelections && (
            <>Select at least {minSelections} option{minSelections > 1 ? 's' : ''}</>
          )}
          {!minSelections && maxSelections && (
            <>Select up to {maxSelections} option{maxSelections > 1 ? 's' : ''}</>
          )}
        </div>
      )}
    </div>
  );
};

// Availability-specific implementation
export interface AvailabilityToggleGroupProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
  contentType?: 'movie' | 'tv';
}

export const AvailabilityToggleGroup = ({
  value,
  onValueChange,
  className,
  contentType = 'movie'
}: AvailabilityToggleGroupProps) => {
  const availabilityOptions: ToggleOption[] = [
    {
      id: 'streaming',
      label: 'Streaming',
      description: 'Available on streaming platforms',
      icon: MonitorPlay,
      value: 'streaming'
    },
    {
      id: 'theatres',
      label: contentType === 'movie' ? 'In Theatres' : 'On TV',
      description: contentType === 'movie' ? 'Currently in movie theaters' : 'Currently airing on TV',
      icon: contentType === 'movie' ? Film : Tv,
      value: contentType === 'movie' ? 'theatres' : 'tv'
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      description: 'Coming soon releases',
      icon: Calendar,
      value: 'upcoming'
    }
  ];

  return (
    <ToggleGroup
      options={availabilityOptions}
      value={value}
      onValueChange={onValueChange}
      label="Availability"
      variant="cards"
      size="md"
      orientation="horizontal"
      allowMultiple={true}
      className={className}
      data-testid="availability-toggle-group"
    />
  );
};

export default ToggleGroup;