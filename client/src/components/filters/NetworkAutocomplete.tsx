import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { Network } from "@/types/filters";

interface NetworkAutocompleteProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function NetworkAutocomplete({ 
  value = [], 
  onChange, 
  placeholder = "Search networks...",
  className 
}: NetworkAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>([]);
  
  const { searchQuery, debouncedQuery, updateQuery, isDebouncing } = useDebouncedSearch(250);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/network', { query: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const networks = useMemo(() => {
    return (searchResults as any)?.results || [];
  }, [searchResults]);

  useEffect(() => {
    if (value.length === 0) {
      setSelectedNetworks([]);
    }
  }, [value]);

  const handleSelect = (network: Network) => {
    const isSelected = value.includes(network.id);
    let newValue: number[];
    let newSelectedNetworks: Network[];

    if (isSelected) {
      newValue = value.filter(id => id !== network.id);
      newSelectedNetworks = selectedNetworks.filter(n => n.id !== network.id);
    } else {
      newValue = [...value, network.id];
      newSelectedNetworks = [...selectedNetworks, network];
    }

    setSelectedNetworks(newSelectedNetworks);
    onChange(newValue);
  };

  const handleRemove = (networkId: number) => {
    const newValue = value.filter(id => id !== networkId);
    const newSelectedNetworks = selectedNetworks.filter(n => n.id !== networkId);
    setSelectedNetworks(newSelectedNetworks);
    onChange(newValue);
  };

  const clearAll = () => {
    setSelectedNetworks([]);
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Radio className="h-4 w-4" />
          TV Networks
        </Label>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            data-testid="clear-networks"
          >
            Clear all
          </Button>
        )}
      </div>

      {selectedNetworks.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {selectedNetworks.map((network) => (
            <Badge
              key={network.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              data-testid={`selected-network-${network.id}`}
            >
              {network.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(network.id)}
                data-testid={`remove-network-${network.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid="network-search-trigger"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search networks..."
              value={searchQuery}
              onValueChange={updateQuery}
              data-testid="network-search-input"
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
              
              {!isLoading && !isDebouncing && debouncedQuery.length >= 2 && networks.length === 0 && (
                <CommandEmpty>No networks found.</CommandEmpty>
              )}
              
              {!isLoading && !isDebouncing && debouncedQuery.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
              )}

              {networks.length > 0 && (
                <CommandGroup>
                  {networks.slice(0, 20).map((network: Network) => {
                    const isSelected = value.includes(network.id);
                    return (
                      <CommandItem
                        key={network.id}
                        value={network.name}
                        onSelect={() => handleSelect(network)}
                        className="flex items-center justify-between"
                        data-testid={`network-option-${network.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="font-medium">{network.name}</div>
                            {network.origin_country && (
                              <div className="text-xs text-muted-foreground">
                                {network.origin_country}
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

      {debouncedQuery.length >= 2 && !isLoading && !isDebouncing && networks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing first 20 results. Be more specific for better results.
        </p>
      )}
    </div>
  );
}
