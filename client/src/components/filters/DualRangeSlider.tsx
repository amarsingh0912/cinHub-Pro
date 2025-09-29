import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, Activity } from "lucide-react";

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
  percentage: number;
}

export interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  step?: number;
  label?: string;
  unit?: string;
  showHistogram?: boolean;
  histogramData?: HistogramBin[];
  showInputs?: boolean;
  showPresets?: boolean;
  presets?: Array<{ label: string; value: [number, number] }>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  disabled?: boolean;
  'data-testid'?: string;
}

export const DualRangeSlider = ({
  min,
  max,
  value,
  onValueChange,
  step = 1,
  label,
  unit = "",
  showHistogram = true,
  histogramData = [],
  showInputs = true,
  showPresets = false,
  presets = [],
  className,
  size = 'md',
  variant = 'premium',
  disabled = false,
  'data-testid': testId
}: DualRangeSliderProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const [inputValues, setInputValues] = useState({
    min: value[0].toString(),
    max: value[1].toString()
  });

  // Update local state when prop changes
  useEffect(() => {
    setLocalValue(value);
    setInputValues({
      min: value[0].toString(),
      max: value[1].toString()
    });
  }, [value]);

  // Calculate histogram heights for visualization
  const maxCount = useMemo(() => {
    return Math.max(...histogramData.map(bin => bin.count), 1);
  }, [histogramData]);

  const normalizedHistogram = useMemo(() => {
    return histogramData.map(bin => ({
      ...bin,
      normalizedHeight: (bin.count / maxCount) * 100
    }));
  }, [histogramData, maxCount]);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };

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

  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    setInputValues(prev => ({ ...prev, [type]: inputValue }));
    
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      const newValue: [number, number] = type === 'min' 
        ? [numValue, Math.max(numValue, localValue[1])]
        : [Math.min(numValue, localValue[0]), numValue];
      
      setLocalValue(newValue);
      onValueChange(newValue);
    }
  };

  const applyPreset = (presetValue: [number, number]) => {
    setLocalValue(presetValue);
    setInputValues({
      min: presetValue[0].toString(),
      max: presetValue[1].toString()
    });
    onValueChange(presetValue);
  };

  const resetToDefault = () => {
    const defaultValue: [number, number] = [min, max];
    applyPreset(defaultValue);
  };

  const formatValue = (val: number) => {
    if (unit === 'minutes') {
      const hours = Math.floor(val / 60);
      const minutes = val % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    return `${val}${unit}`;
  };

  const isInRange = (binStart: number, binEnd: number) => {
    return !(binEnd < localValue[0] || binStart > localValue[1]);
  };

  return (
    <div 
      className={cn("space-y-4", className)}
      data-testid={testId}
    >
      {/* Header */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className={cn("font-medium flex items-center gap-2", sizeClasses[size])}>
            <Clock className="h-4 w-4" />
            {label}
          </Label>
          
          <div className="flex items-center gap-2">
            {/* Current range badge */}
            <Badge 
              variant="secondary" 
              className={cn(
                "glass-panel border-white/10",
                isDragging && "animate-pulse"
              )}
            >
              {formatValue(localValue[0])} - {formatValue(localValue[1])}
            </Badge>
            
            {/* Reset button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefault}
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              title="Reset to default range"
              data-testid="reset-range"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Histogram visualization */}
      {showHistogram && normalizedHistogram.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            Distribution ({histogramData.reduce((sum, bin) => sum + bin.count, 0).toLocaleString()} items)
          </div>
          
          <div 
            className="relative h-16 w-full rounded-lg bg-muted/20 overflow-hidden"
            data-testid="histogram"
          >
            <div className="absolute inset-0 flex items-end">
              {normalizedHistogram.map((bin, index) => {
                const isSelected = isInRange(bin.start, bin.end);
                const widthPercentage = ((bin.end - bin.start) / (max - min)) * 100;
                const leftPercentage = ((bin.start - min) / (max - min)) * 100;
                
                return (
                  <motion.div
                    key={index}
                    className={cn(
                      "absolute bottom-0 transition-all duration-300 cursor-pointer group",
                      "border-r border-background/20 last:border-r-0"
                    )}
                    style={{
                      left: `${leftPercentage}%`,
                      width: `${widthPercentage}%`,
                      height: `${bin.normalizedHeight}%`
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${bin.normalizedHeight}%` }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => applyPreset([bin.start, bin.end])}
                    data-testid={`histogram-bin-${index}`}
                  >
                    <div 
                      className={cn(
                        "w-full h-full transition-all duration-200",
                        isSelected 
                          ? "bg-gradient-to-t from-primary/60 via-primary/40 to-primary/20 shadow-md" 
                          : "bg-gradient-to-t from-muted/60 via-muted/40 to-muted/20",
                        "hover:from-primary/40 hover:via-primary/25 hover:to-primary/10",
                        "group-hover:shadow-lg"
                      )}
                    />
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="glass-panel px-2 py-1 text-xs whitespace-nowrap">
                        {formatValue(bin.start)} - {formatValue(bin.end)}
                        <br />
                        {bin.count.toLocaleString()} items ({bin.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Range overlay */}
            <div 
              className="absolute top-0 h-full bg-primary/10 border-l-2 border-r-2 border-primary/30 transition-all duration-200"
              style={{
                left: `${((localValue[0] - min) / (max - min)) * 100}%`,
                width: `${((localValue[1] - localValue[0]) / (max - min)) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Slider */}
      <div className="px-1">
        <Slider
          min={min}
          max={max}
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
          data-testid="dual-range-slider"
        />
      </div>

      {/* Input controls and presets */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Manual inputs */}
        {showInputs && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Min:</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={inputValues.min}
                onChange={(e) => handleInputChange('min', e.target.value)}
                className="w-16 h-7 text-xs glass-input"
                data-testid="min-input"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Max:</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={inputValues.max}
                onChange={(e) => handleInputChange('max', e.target.value)}
                className="w-16 h-7 text-xs glass-input"
                data-testid="max-input"
              />
            </div>
          </div>
        )}

        {/* Preset buttons */}
        {showPresets && presets.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <AnimatePresence mode="popLayout">
              {presets.map((preset, index) => (
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
                    onClick={() => applyPreset(preset.value)}
                    className={cn(
                      "h-7 px-2 text-xs glass-panel border-white/10",
                      "hover:bg-primary/5 transition-all duration-200",
                      localValue[0] === preset.value[0] && localValue[1] === preset.value[1] &&
                      "bg-primary/10 border-primary/20"
                    )}
                    data-testid={`preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {preset.label}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// Runtime-specific implementation
export interface RuntimeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
  contentType?: 'movie' | 'tv';
}

export const RuntimeSlider = ({
  value,
  onValueChange,
  className,
  contentType = 'movie'
}: RuntimeSliderProps) => {
  // Different ranges for movies vs TV shows
  const config = contentType === 'movie' 
    ? { min: 60, max: 240, step: 5 }
    : { min: 15, max: 120, step: 5 };

  // Sample histogram data - in real app this would come from API
  const sampleHistogram: HistogramBin[] = contentType === 'movie' 
    ? [
        { start: 60, end: 90, count: 1250, percentage: 12.5 },
        { start: 90, end: 120, count: 3200, percentage: 32.0 },
        { start: 120, end: 150, count: 2800, percentage: 28.0 },
        { start: 150, end: 180, count: 1800, percentage: 18.0 },
        { start: 180, end: 210, count: 700, percentage: 7.0 },
        { start: 210, end: 240, count: 250, percentage: 2.5 }
      ]
    : [
        { start: 15, end: 30, count: 800, percentage: 16.0 },
        { start: 30, end: 45, count: 1600, percentage: 32.0 },
        { start: 45, end: 60, count: 1400, percentage: 28.0 },
        { start: 60, end: 90, count: 900, percentage: 18.0 },
        { start: 90, end: 120, count: 300, percentage: 6.0 }
      ];

  const presets = contentType === 'movie'
    ? [
        { label: 'Short', value: [60, 100] as [number, number] },
        { label: 'Standard', value: [90, 150] as [number, number] },
        { label: 'Long', value: [150, 240] as [number, number] }
      ]
    : [
        { label: 'Episodes', value: [15, 60] as [number, number] },
        { label: 'Extended', value: [45, 120] as [number, number] }
      ];

  return (
    <DualRangeSlider
      min={config.min}
      max={config.max}
      step={config.step}
      value={value}
      onValueChange={onValueChange}
      label={`${contentType === 'movie' ? 'Movie' : 'Episode'} Runtime`}
      unit="minutes"
      showHistogram={true}
      histogramData={sampleHistogram}
      showInputs={true}
      showPresets={true}
      presets={presets}
      size="md"
      variant="premium"
      className={className}
      data-testid="runtime-slider"
    />
  );
};

export default DualRangeSlider;