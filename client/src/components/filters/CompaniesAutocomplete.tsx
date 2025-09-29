import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { Company } from "@/types/filters";

interface CompaniesAutocompleteProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function CompaniesAutocomplete({ 
  value = [], 
  onChange, 
  placeholder = "Search production companies...",
  className 
}: CompaniesAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  
  // Debounced search with 250ms delay
  const { searchQuery, debouncedQuery, updateQuery, clearQuery, isDebouncing } = useDebouncedSearch(250);

  // Query for searching companies with debounced query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/company', { query: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Memoized search results
  const companies = useMemo(() => {
    return (searchResults as any)?.results || [];
  }, [searchResults]);

  // Effect to update selected companies when value changes externally
  useEffect(() => {
    if (value.length === 0) {
      setSelectedCompanies([]);
    }
  }, [value]);

  const handleSelect = (company: Company) => {
    const isSelected = value.includes(company.id);
    let newValue: number[];
    let newSelectedCompanies: Company[];

    if (isSelected) {
      // Remove company
      newValue = value.filter(id => id !== company.id);
      newSelectedCompanies = selectedCompanies.filter(c => c.id !== company.id);
    } else {
      // Add company
      newValue = [...value, company.id];
      newSelectedCompanies = [...selectedCompanies, company];
    }

    setSelectedCompanies(newSelectedCompanies);
    onChange(newValue);
  };

  const handleRemove = (companyId: number) => {
    const newValue = value.filter(id => id !== companyId);
    const newSelectedCompanies = selectedCompanies.filter(c => c.id !== companyId);
    setSelectedCompanies(newSelectedCompanies);
    onChange(newValue);
  };

  const clearAll = () => {
    setSelectedCompanies([]);
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Production Companies
        </Label>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            data-testid="clear-companies"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected companies display */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {selectedCompanies.map((company) => (
            <Badge
              key={company.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              data-testid={`selected-company-${company.id}`}
            >
              {company.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(company.id)}
                data-testid={`remove-company-${company.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid="companies-search-trigger"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search companies..."
              value={searchQuery}
              onValueChange={updateQuery}
              data-testid="companies-search-input"
            />
            <CommandList>
              {(isLoading || isDebouncing) && (
                <CommandEmpty>
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                  </div>
                </CommandEmpty>
              )}
              
              {!isLoading && !isDebouncing && debouncedQuery.length >= 2 && companies.length === 0 && (
                <CommandEmpty>No companies found.</CommandEmpty>
              )}
              
              {!isLoading && !isDebouncing && debouncedQuery.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
              )}

              {companies.length > 0 && (
                <CommandGroup>
                  {companies.slice(0, 20).map((company: Company) => {
                    const isSelected = value.includes(company.id);
                    return (
                      <CommandItem
                        key={company.id}
                        value={company.name}
                        onSelect={() => handleSelect(company)}
                        className="flex items-center justify-between"
                        data-testid={`company-option-${company.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="font-medium">{company.name}</div>
                            {company.origin_country && (
                              <div className="text-xs text-muted-foreground">
                                {company.origin_country}
                              </div>
                            )}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper text */}
      {debouncedQuery.length >= 2 && !isLoading && !isDebouncing && companies.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing first 20 results. Be more specific for better results.
        </p>
      )}
    </div>
  );
}