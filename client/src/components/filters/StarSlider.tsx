import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Users, TrendingUp, RotateCcw, Filter } from "lucide-react";

export interface StarSliderProps {
  minRating: number;
  maxRating: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  voteCount?: number;
  onVoteCountChange?: (count: number) => void;
  step?: number;
  label?: string;
  showVoteFloor?: boolean;
  showPresets?: boolean;
  presets?: Array<{ label: string; value: [number, number]; voteCount?: number }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  disabled?: boolean;
  'data-testid'?: string;
}

export const StarSlider = ({
  minRating,
  maxRating,
  value,
  onValueChange,
  voteCount = 0,
  onVoteCountChange,
  step = 0.1,
  label = "Rating",
  showVoteFloor = true,
  showPresets = true,
  presets = [],
  className,
  size = 'md',
  variant = 'premium',
  disabled = false,
  'data-testid': testId
}: StarSliderProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [localVoteCount, setLocalVoteCount] = useState(voteCount);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    setLocalVoteCount(voteCount);
  }, [voteCount]);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const starSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Generate star display for current rating range
  const generateStars = useCallback((rating: number, isInteractive: boolean = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const totalStars = maxRating;

    for (let i = 1; i <= totalStars; i++) {
      const isFilled = i <= fullStars;
      const isHalf = i === fullStars + 1 && hasHalfStar;
      const isHovered = hoveredStar !== null && i <= hoveredStar;
      
      stars.push(
        <motion.div
          key={i}
          className={cn(
            "relative cursor-pointer transition-all duration-200",
            isInteractive && "hover:scale-110"
          )}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
          onMouseEnter={() => isInteractive && setHoveredStar(i)}
          onMouseLeave={() => isInteractive && setHoveredStar(null)}
          onClick={() => isInteractive && onValueChange([minRating, i])}
        >
          <Star
            className={cn(
              starSizeClasses[size],
              "transition-all duration-200",
              (isFilled || isHovered) 
                ? "fill-yellow-400 text-yellow-400" 
                : isHalf 
                  ? "fill-yellow-400/50 text-yellow-400" 
                  : "fill-muted/20 text-muted-foreground/30"
            )}
          />
          
          {/* Glow effect for filled stars */}
          {(isFilled || isHovered) && (
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-400/20 blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
            />
          )}
        </motion.div>
      );
    }

    return stars;
  }, [maxRating, minRating, size, hoveredStar, onValueChange]);

  const handleSliderChange = useCallback((newValue: number[]) => {
    const rangePair: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(rangePair);
    setIsDragging(true);
    
    // Debounced update to parent
    setTimeout(() => {
      onValueChange(rangePair);
      setIsDragging(false);
    }, 100);
  }, [onValueChange]);

  const handleVoteCountChange = useCallback((newCount: string) => {
    const count = parseInt(newCount) || 0;
    setLocalVoteCount(count);
    onVoteCountChange?.(count);
  }, [onVoteCountChange]);

  const applyPreset = (preset: { value: [number, number]; voteCount?: number }) => {
    setLocalValue(preset.value);
    onValueChange(preset.value);
    
    if (preset.voteCount !== undefined && onVoteCountChange) {
      setLocalVoteCount(preset.voteCount);
      onVoteCountChange(preset.voteCount);
    }
  };

  const resetToDefault = () => {
    const defaultValue: [number, number] = [minRating, maxRating];
    setLocalValue(defaultValue);
    onValueChange(defaultValue);
    
    if (onVoteCountChange) {
      setLocalVoteCount(0);
      onVoteCountChange(0);
    }
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  const getQualityLevel = (rating: number) => {
    if (rating >= 8.5) return { label: "Excellent", color: "text-green-500" };
    if (rating >= 7.5) return { label: "Very Good", color: "text-blue-500" };
    if (rating >= 6.5) return { label: "Good", color: "text-yellow-500" };
    if (rating >= 5.5) return { label: "Average", color: "text-orange-500" };
    return { label: "Poor", color: "text-red-500" };
  };

  const defaultPresets = [
    { label: "Excellent", value: [8.5, 10] as [number, number], voteCount: 1000 },
    { label: "Very Good", value: [7.5, 10] as [number, number], voteCount: 500 },
    { label: "Good+", value: [6.5, 10] as [number, number], voteCount: 100 },
    { label: "Watchable", value: [5.0, 10] as [number, number], voteCount: 50 }
  ];

  const presetsToUse = presets.length > 0 ? presets : defaultPresets;

  return (
    <div 
      className={cn("space-y-4", className)}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className={cn("font-medium flex items-center gap-2", sizeClasses[size])}>
          <Star className="h-4 w-4" />
          {label}
        </Label>
        
        <div className="flex items-center gap-2">
          {/* Current range badge with quality indicator */}
          <Badge 
            variant="secondary" 
            className={cn(
              "glass-panel border-white/10 flex items-center gap-1",
              isDragging && "animate-pulse"
            )}
          >
            <div className="flex items-center">
              {generateStars(localValue[1], false).slice(0, 3)}
            </div>
            <span className="ml-1">
              {formatRating(localValue[0])} - {formatRating(localValue[1])}
            </span>
          </Badge>
          
          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
            title="Reset to default range"
            data-testid="reset-rating"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Star visualization */}
      <Card className={cn(
        "glass-panel border-white/10",
        variant === 'premium' && "backdrop-blur-md"
      )}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Current rating range with stars */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1">
                {generateStars(localValue[1], true)}
              </div>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Min:</span>
                  <span className={cn("font-medium", getQualityLevel(localValue[0]).color)}>
                    {formatRating(localValue[0])}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({getQualityLevel(localValue[0]).label})
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Max:</span>
                  <span className={cn("font-medium", getQualityLevel(localValue[1]).color)}>
                    {formatRating(localValue[1])}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({getQualityLevel(localValue[1]).label})
                  </span>
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="px-2">
              <Slider
                min={minRating}
                max={maxRating}
                step={step}
                value={localValue}
                onValueChange={handleSliderChange}
                disabled={disabled}
                className={cn(
                  "w-full",
                  variant === 'premium' && "[&_[role=slider]]:glass-panel [&_[role=slider]]:border-white/20",
                  size === 'sm' && "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
                  size === 'lg' && "[&_[role=slider]]:h-6 [&_[role=slider]]:w-6"
                )}
                data-testid="rating-slider"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vote floor stepper */}
      {showVoteFloor && (
        <Card className={cn(
          "glass-panel border-white/10",
          variant === 'premium' && "backdrop-blur-md"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className={cn("flex items-center gap-2", sizeClasses[size])}>
              <Users className="h-4 w-4" />
              Minimum Vote Count
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={100000}
                  value={localVoteCount}
                  onChange={(e) => handleVoteCountChange(e.target.value)}
                  placeholder="0"
                  className="glass-input"
                  data-testid="vote-count-input"
                />
              </div>
              
              <div className="flex gap-1">
                {[50, 100, 500, 1000].map((count) => (
                  <Button
                    key={count}
                    variant="outline"
                    size="sm"
                    onClick={() => handleVoteCountChange(count.toString())}
                    className={cn(
                      "h-7 px-2 text-xs glass-panel border-white/10",
                      "hover:bg-primary/5 transition-all duration-200",
                      localVoteCount === count && "bg-primary/10 border-primary/20"
                    )}
                    data-testid={`vote-preset-${count}`}
                  >
                    {count >= 1000 ? `${count / 1000}k` : count}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-muted-foreground">
              {localVoteCount > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Filters out content with fewer than {localVoteCount.toLocaleString()} votes
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preset buttons */}
      {showPresets && presetsToUse.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Quick Presets
          </Label>
          
          <div className="flex gap-2 flex-wrap">
            <AnimatePresence mode="popLayout">
              {presetsToUse.map((preset, index) => {
                const isActive = 
                  localValue[0] === preset.value[0] && 
                  localValue[1] === preset.value[1] &&
                  (preset.voteCount === undefined || localVoteCount === preset.voteCount);
                
                return (
                  <motion.div
                    key={preset.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "h-8 px-3 text-xs glass-panel border-white/10",
                        "hover:bg-primary/5 transition-all duration-200",
                        "flex items-center gap-1.5",
                        isActive && "bg-primary/10 border-primary/20"
                      )}
                      data-testid={`rating-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-center">
                        {generateStars(preset.value[1], false).slice(0, 2)}
                      </div>
                      <span>{preset.label}</span>
                      {preset.voteCount && (
                        <span className="text-xs opacity-70">
                          ({preset.voteCount >= 1000 ? `${preset.voteCount / 1000}k` : preset.voteCount}+)
                        </span>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

// TMDB-specific implementation
export interface RatingSliderProps {
  value: {
    min?: number;
    max?: number;
  };
  onValueChange: (value: { min?: number; max?: number }) => void;
  voteCount?: number;
  onVoteCountChange?: (count: number) => void;
  className?: string;
}

export const RatingSlider = ({
  value,
  onValueChange,
  voteCount = 0,
  onVoteCountChange,
  className
}: RatingSliderProps) => {
  // TMDB uses 0-10 rating scale
  const minRating = 0;
  const maxRating = 10;
  
  const currentValue: [number, number] = [
    value.min ?? minRating,
    value.max ?? maxRating
  ];

  const handleValueChange = (newValue: [number, number]) => {
    onValueChange({
      min: newValue[0] > minRating ? newValue[0] : undefined,
      max: newValue[1] < maxRating ? newValue[1] : undefined
    });
  };

  return (
    <StarSlider
      minRating={minRating}
      maxRating={maxRating}
      value={currentValue}
      onValueChange={handleValueChange}
      voteCount={voteCount}
      onVoteCountChange={onVoteCountChange}
      step={0.1}
      label="User Rating"
      showVoteFloor={true}
      showPresets={true}
      size="md"
      variant="premium"
      className={className}
      data-testid="rating-filter"
    />
  );
};

export default StarSlider;