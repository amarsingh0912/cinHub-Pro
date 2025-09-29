import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Check, 
  X, 
  MonitorPlay, 
  Tv, 
  Film,
  Smartphone,
  Tablet,
  Globe,
  RotateCcw,
  Filter
} from "lucide-react";

export interface LogoGridProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
  monetization_types?: string[];
  description?: string;
}

export interface LogoGridProps {
  providers: LogoGridProvider[];
  selectedProviders: number[];
  onProvidersChange: (providers: number[]) => void;
  selectedMonetizationTypes: string[];
  onMonetizationTypesChange: (types: string[]) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  showSearch?: boolean;
  showMonetization?: boolean;
  maxSelections?: number;
  'data-testid'?: string;
}

const MONETIZATION_OPTIONS = [
  { value: 'flatrate', label: 'Subscription', icon: MonitorPlay, color: 'blue' },
  { value: 'free', label: 'Free', icon: Globe, color: 'green' },
  { value: 'ads', label: 'Free with Ads', icon: Tv, color: 'yellow' },
  { value: 'rent', label: 'Rent', icon: Smartphone, color: 'orange' },
  { value: 'buy', label: 'Buy', icon: Film, color: 'purple' }
];

export const LogoGrid = ({
  providers,
  selectedProviders,
  onProvidersChange,
  selectedMonetizationTypes,
  onMonetizationTypesChange,
  className,
  size = 'md',
  variant = 'premium',
  showSearch = true,
  showMonetization = true,
  maxSelections,
  'data-testid': testId
}: LogoGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredProvider, setHoveredProvider] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const gridCols = {
    sm: 'grid-cols-6',
    md: 'grid-cols-5',
    lg: 'grid-cols-4'
  };

  // Filter providers based on search query
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    
    const query = searchQuery.toLowerCase();
    return providers.filter(provider => 
      provider.provider_name.toLowerCase().includes(query) ||
      provider.description?.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  // Sort providers by priority and selection status
  const sortedProviders = useMemo(() => {
    return filteredProviders.sort((a, b) => {
      const aSelected = selectedProviders.includes(a.provider_id);
      const bSelected = selectedProviders.includes(b.provider_id);
      
      // Selected providers first
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Then by display priority
      return a.display_priority - b.display_priority;
    });
  }, [filteredProviders, selectedProviders]);

  const toggleProvider = (providerId: number) => {
    const isSelected = selectedProviders.includes(providerId);
    let newSelection: number[];

    if (isSelected) {
      // Remove provider
      newSelection = selectedProviders.filter(id => id !== providerId);
    } else {
      // Add provider (check max selections)
      if (maxSelections && selectedProviders.length >= maxSelections) {
        return; // Max selections reached
      }
      newSelection = [...selectedProviders, providerId];
    }

    onProvidersChange(newSelection);
  };

  const toggleMonetizationType = (type: string) => {
    const isSelected = selectedMonetizationTypes.includes(type);
    const newTypes = isSelected
      ? selectedMonetizationTypes.filter(t => t !== type)
      : [...selectedMonetizationTypes, type];
    
    onMonetizationTypesChange(newTypes);
  };

  const clearAll = () => {
    onProvidersChange([]);
    onMonetizationTypesChange([]);
  };

  const getProviderLogo = (provider: LogoGridProvider) => {
    if (provider.logo_path?.startsWith('http')) {
      return provider.logo_path;
    }
    return `https://image.tmdb.org/t/p/w92${provider.logo_path}`;
  };

  return (
    <div 
      className={cn("space-y-4", className)}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MonitorPlay className="h-4 w-4" />
          Streaming Providers
        </Label>
        
        <div className="flex items-center gap-2">
          {/* Selection count badge */}
          {selectedProviders.length > 0 && (
            <Badge 
              variant="secondary" 
              className="glass-panel border-white/10"
            >
              {selectedProviders.length}{maxSelections && `/${maxSelections}`} selected
            </Badge>
          )}
          
          {/* Clear all button */}
          {(selectedProviders.length > 0 || selectedMonetizationTypes.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
              title="Clear all selections"
              data-testid="clear-providers"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search streaming services..."
            className={cn(
              "pl-10 glass-input",
              variant === 'premium' && "border-white/10"
            )}
            data-testid="provider-search"
          />
        </div>
      )}

      {/* Monetization type filters */}
      {showMonetization && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Availability Type
          </Label>
          <div className="flex flex-wrap gap-2">
            {MONETIZATION_OPTIONS.map((option) => {
              const isSelected = selectedMonetizationTypes.includes(option.value);
              const IconComponent = option.icon;
              
              return (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMonetizationType(option.value)}
                    className={cn(
                      "h-8 px-3 text-xs glass-panel border-white/10",
                      "hover:bg-primary/5 transition-all duration-200",
                      "flex items-center gap-1.5",
                      isSelected && "bg-primary/10 border-primary/20 shadow-glow"
                    )}
                    data-testid={`monetization-${option.value}`}
                  >
                    <IconComponent className="h-3 w-3" />
                    {option.label}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <Separator className="opacity-50" />

      {/* Provider logos grid */}
      <ScrollArea className="h-64 w-full">
        <div className={cn("grid gap-3 p-1", gridCols[size])}>
          <AnimatePresence mode="popLayout">
            {sortedProviders.map((provider, index) => {
              const isSelected = selectedProviders.includes(provider.provider_id);
              const isHovered = hoveredProvider === provider.provider_id;
              const isDisabled = maxSelections && !isSelected && selectedProviders.length >= maxSelections;
              
              return (
                <motion.div
                  key={provider.provider_id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    delay: index * 0.02
                  }}
                  className={cn(
                    "relative group cursor-pointer",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onMouseEnter={() => !isDisabled && setHoveredProvider(provider.provider_id)}
                  onMouseLeave={() => setHoveredProvider(null)}
                  onClick={() => !isDisabled && toggleProvider(provider.provider_id)}
                  data-testid={`provider-${provider.provider_id}`}
                >
                  <div className={cn(
                    "relative rounded-xl border-2 transition-all duration-300",
                    "bg-background/50 backdrop-blur-sm",
                    sizeClasses[size],
                    "flex items-center justify-center overflow-hidden",
                    isSelected 
                      ? "border-primary/50 shadow-glow bg-primary/5" 
                      : isHovered
                        ? "border-primary/30 shadow-md"
                        : "border-border/50 hover:border-border",
                    variant === 'premium' && "glass-panel border-white/10"
                  )}>
                    {/* Provider logo */}
                    <img
                      src={getProviderLogo(provider)}
                      alt={provider.provider_name}
                      className={cn(
                        "w-full h-full object-contain transition-all duration-300",
                        "group-hover:scale-110",
                        isSelected && "scale-105"
                      )}
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    
                    {/* Text fallback */}
                    <div className="hidden text-xs font-medium text-center p-2 leading-tight">
                      {provider.provider_name}
                    </div>

                    {/* Selection indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hover glow effect */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 rounded-xl bg-primary/10 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="glass-panel px-2 py-1 text-xs whitespace-nowrap shadow-lg border border-white/10">
                          <div className="font-medium">{provider.provider_name}</div>
                          {provider.description && (
                            <div className="text-muted-foreground text-xs mt-0.5">
                              {provider.description}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        
        {/* Empty state */}
        {filteredProviders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MonitorPlay className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No providers found matching your search" : "No streaming providers available"}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Footer info */}
      {filteredProviders.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} available
          {searchQuery && ` • Filtered by "${searchQuery}"`}
        </div>
      )}
    </div>
  );
};

export default LogoGrid;