import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search, Globe } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface Country {
  iso_3166_1: string;
  english_name: string;
  native_name?: string;
}

export interface CountrySelectProps {
  countries: Country[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showFlags?: boolean;
  showNativeNames?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium' | 'minimal';
  disabled?: boolean;
  'data-testid'?: string;
}

// Function to get flag emoji from country code
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Convert country code to flag emoji using regional indicator symbols
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

// Popular countries that should appear at the top
const POPULAR_COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'KR', 'IN', 'BR'];

export const CountrySelect = ({
  countries,
  value,
  onValueChange,
  placeholder = "Select country...",
  label,
  className,
  showFlags = true,
  showNativeNames = false,
  size = 'md',
  variant = 'premium',
  disabled = false,
  'data-testid': testId
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  // Find selected country
  const selectedCountry = useMemo(() => {
    return countries.find(country => country.iso_3166_1 === value);
  }, [countries, value]);

  // Filter and sort countries
  const sortedCountries = useMemo(() => {
    let filtered = countries;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = countries.filter(country => 
        country.english_name.toLowerCase().includes(query) ||
        country.native_name?.toLowerCase().includes(query) ||
        country.iso_3166_1.toLowerCase().includes(query)
      );
    }

    // Sort: popular countries first, then alphabetically
    return filtered.sort((a, b) => {
      const aPopular = POPULAR_COUNTRIES.includes(a.iso_3166_1);
      const bPopular = POPULAR_COUNTRIES.includes(b.iso_3166_1);
      
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      if (aPopular && bPopular) {
        return POPULAR_COUNTRIES.indexOf(a.iso_3166_1) - POPULAR_COUNTRIES.indexOf(b.iso_3166_1);
      }
      
      return a.english_name.localeCompare(b.english_name);
    });
  }, [countries, searchQuery]);

  // Group countries for better organization
  const groupedCountries = useMemo(() => {
    const popular = sortedCountries.filter(country => 
      POPULAR_COUNTRIES.includes(country.iso_3166_1)
    );
    const others = sortedCountries.filter(country => 
      !POPULAR_COUNTRIES.includes(country.iso_3166_1)
    );
    
    return { popular, others };
  }, [sortedCountries]);

  const handleSelect = (countryCode: string) => {
    onValueChange(countryCode === value ? undefined : countryCode);
    setOpen(false);
  };

  const clearSelection = () => {
    onValueChange(undefined);
  };

  return (
    <div className={cn("space-y-2", className)} data-testid={testId}>
      {/* Label */}
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {label}
        </Label>
      )}

      {/* Select trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              sizeClasses[size],
              variant === 'premium' && "glass-panel border-white/10",
              !selectedCountry && "text-muted-foreground"
            )}
            data-testid="country-select-trigger"
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedCountry ? (
                <>
                  {showFlags && (
                    <span className="text-lg flex-shrink-0" aria-hidden="true">
                      {getFlagEmoji(selectedCountry.iso_3166_1)}
                    </span>
                  )}
                  <span className="truncate">
                    {selectedCountry.english_name}
                  </span>
                  {showNativeNames && selectedCountry.native_name && selectedCountry.native_name !== selectedCountry.english_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      ({selectedCountry.native_name})
                    </span>
                  )}
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {selectedCountry && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-70 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  title="Clear selection"
                  data-testid="clear-country"
                >
                  ×
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn(
            "w-full p-0",
            variant === 'premium' && "glass-panel border-white/10 backdrop-blur-md"
          )} 
          align="start"
          data-testid="country-select-content"
        >
          <Command>
            <div className="flex items-center border-b border-border/50 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search countries..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="country-search-input"
              />
            </div>
            
            <CommandList className="max-h-64">
              <CommandEmpty>
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No countries found.
                </div>
              </CommandEmpty>
              
              {/* Popular countries */}
              {groupedCountries.popular.length > 0 && !searchQuery && (
                <CommandGroup heading="Popular">
                  {groupedCountries.popular.map((country) => {
                    const isSelected = value === country.iso_3166_1;
                    
                    return (
                      <CommandItem
                        key={country.iso_3166_1}
                        value={`${country.english_name} ${country.iso_3166_1} ${country.native_name || ''}`}
                        onSelect={() => handleSelect(country.iso_3166_1)}
                        className={cn(
                          "flex items-center justify-between cursor-pointer",
                          "transition-all duration-200",
                          isSelected && "bg-primary/10"
                        )}
                        data-testid={`country-option-${country.iso_3166_1}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {showFlags && (
                            <span className="text-lg flex-shrink-0" aria-hidden="true">
                              {getFlagEmoji(country.iso_3166_1)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {country.english_name}
                            </div>
                            {showNativeNames && country.native_name && country.native_name !== country.english_name && (
                              <div className="text-xs text-muted-foreground truncate">
                                {country.native_name}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {country.iso_3166_1}
                          </Badge>
                        </div>
                        
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              
              {/* All other countries */}
              {groupedCountries.others.length > 0 && (
                <CommandGroup heading={searchQuery ? "Results" : "All Countries"}>
                  {groupedCountries.others.map((country) => {
                    const isSelected = value === country.iso_3166_1;
                    
                    return (
                      <CommandItem
                        key={country.iso_3166_1}
                        value={`${country.english_name} ${country.iso_3166_1} ${country.native_name || ''}`}
                        onSelect={() => handleSelect(country.iso_3166_1)}
                        className={cn(
                          "flex items-center justify-between cursor-pointer",
                          "transition-all duration-200",
                          isSelected && "bg-primary/10"
                        )}
                        data-testid={`country-option-${country.iso_3166_1}`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {showFlags && (
                            <span className="text-lg flex-shrink-0" aria-hidden="true">
                              {getFlagEmoji(country.iso_3166_1)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {country.english_name}
                            </div>
                            {showNativeNames && country.native_name && country.native_name !== country.english_name && (
                              <div className="text-xs text-muted-foreground truncate">
                                {country.native_name}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {country.iso_3166_1}
                          </Badge>
                        </div>
                        
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="h-4 w-4 text-primary" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CountrySelect;