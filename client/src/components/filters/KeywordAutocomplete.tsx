import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { Keyword } from "@/types/filters";

interface KeywordAutocompleteProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function KeywordAutocomplete({ 
  value = [], 
  onChange, 
  placeholder = "Search keywords...",
  label = "Keywords",
  className 
}: KeywordAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([]);
  
  const { searchQuery, debouncedQuery, updateQuery, isDebouncing } = useDebouncedSearch(250);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/keyword', { query: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const keywords = useMemo(() => {
    return (searchResults as any)?.results || [];
  }, [searchResults]);

  useEffect(() => {
    if (value.length === 0) {
      setSelectedKeywords([]);
    }
  }, [value]);

  const handleSelect = (keyword: Keyword) => {
    const isSelected = value.includes(keyword.id);
    let newValue: number[];
    let newSelectedKeywords: Keyword[];

    if (isSelected) {
      newValue = value.filter(id => id !== keyword.id);
      newSelectedKeywords = selectedKeywords.filter(k => k.id !== keyword.id);
    } else {
      newValue = [...value, keyword.id];
      newSelectedKeywords = [...selectedKeywords, keyword];
    }

    setSelectedKeywords(newSelectedKeywords);
    onChange(newValue);
  };

  const handleRemove = (keywordId: number) => {
    const newValue = value.filter(id => id !== keywordId);
    const newSelectedKeywords = selectedKeywords.filter(k => k.id !== keywordId);
    setSelectedKeywords(newSelectedKeywords);
    onChange(newValue);
  };

  const clearAll = () => {
    setSelectedKeywords([]);
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {label}
        </Label>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            data-testid="clear-keywords"
          >
            Clear all
          </Button>
        )}
      </div>

      {selectedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {selectedKeywords.map((keyword) => (
            <Badge
              key={keyword.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              data-testid={`selected-keyword-${keyword.id}`}
            >
              {keyword.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(keyword.id)}
                data-testid={`remove-keyword-${keyword.id}`}
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
            data-testid="keyword-search-trigger"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search keywords..."
              value={searchQuery}
              onValueChange={updateQuery}
              data-testid="keyword-search-input"
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
              
              {!isLoading && !isDebouncing && debouncedQuery.length >= 2 && keywords.length === 0 && (
                <CommandEmpty>No keywords found.</CommandEmpty>
              )}
              
              {!isLoading && !isDebouncing && debouncedQuery.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
              )}

              {keywords.length > 0 && (
                <CommandGroup>
                  {keywords.slice(0, 20).map((keyword: Keyword) => {
                    const isSelected = value.includes(keyword.id);
                    return (
                      <CommandItem
                        key={keyword.id}
                        value={keyword.name}
                        onSelect={() => handleSelect(keyword)}
                        className="flex items-center justify-between"
                        data-testid={`keyword-option-${keyword.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="font-medium">{keyword.name}</div>
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

      {debouncedQuery.length >= 2 && !isLoading && !isDebouncing && keywords.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing first 20 results. Be more specific for better results.
        </p>
      )}
    </div>
  );
}
