import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RangeFieldProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  label?: string;
  unit?: string;
  showInputs?: boolean;
  className?: string;
  formatValue?: (value: number) => string;
}

export function RangeField({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  unit,
  showInputs = true,
  className,
  formatValue
}: RangeFieldProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSliderChange = (newValue: number[]) => {
    const rangeValue: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(rangeValue);
    onChange(rangeValue);
  };

  const handleInputChange = (index: 0 | 1, inputValue: string) => {
    const numValue = parseInt(inputValue) || (index === 0 ? min : max);
    const clampedValue = Math.min(Math.max(numValue, min), max);
    const newValue: [number, number] = index === 0 
      ? [clampedValue, Math.max(clampedValue, localValue[1])]
      : [Math.min(localValue[0], clampedValue), clampedValue];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const displayValue = formatValue || ((v: number) => `${v}${unit || ''}`);

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            {displayValue(localValue[0])} - {displayValue(localValue[1])}
          </span>
        </div>
      )}
      
      <Slider
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={handleSliderChange}
        className="w-full"
      />

      {showInputs && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={min}
            max={max}
            value={localValue[0]}
            onChange={(e) => handleInputChange(0, e.target.value)}
            className="h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="number"
            min={min}
            max={max}
            value={localValue[1]}
            onChange={(e) => handleInputChange(1, e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
