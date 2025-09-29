import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { Person } from "@/types/filters";

interface PeopleAutocompleteProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  className?: string;
}

export function PeopleAutocomplete({ 
  value = [], 
  onChange, 
  placeholder = "Search cast or crew...",
  className 
}: PeopleAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  
  // Debounced search with 250ms delay
  const { searchQuery, debouncedQuery, updateQuery, clearQuery, isDebouncing } = useDebouncedSearch(250);

  // Query for searching people with debounced query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/person', { query: debouncedQuery }],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Memoized search results
  const people = useMemo(() => {
    return (searchResults as any)?.results || [];
  }, [searchResults]);

  // Effect to update selected people when value changes externally
  useEffect(() => {
    if (value.length === 0) {
      setSelectedPeople([]);
    }
  }, [value]);

  const handleSelect = (person: Person) => {
    const isSelected = value.includes(person.id);
    let newValue: number[];
    let newSelectedPeople: Person[];

    if (isSelected) {
      // Remove person
      newValue = value.filter(id => id !== person.id);
      newSelectedPeople = selectedPeople.filter(p => p.id !== person.id);
    } else {
      // Add person
      newValue = [...value, person.id];
      newSelectedPeople = [...selectedPeople, person];
    }

    setSelectedPeople(newSelectedPeople);
    onChange(newValue);
  };

  const handleRemove = (personId: number) => {
    const newValue = value.filter(id => id !== personId);
    const newSelectedPeople = selectedPeople.filter(p => p.id !== personId);
    setSelectedPeople(newSelectedPeople);
    onChange(newValue);
  };

  const clearAll = () => {
    setSelectedPeople([]);
    onChange([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Cast & Crew
        </Label>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            data-testid="clear-people"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Selected people display */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
          {selectedPeople.map((person) => (
            <Badge
              key={person.id}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
              data-testid={`selected-person-${person.id}`}
            >
              {person.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(person.id)}
                data-testid={`remove-person-${person.id}`}
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
            data-testid="people-search-trigger"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search people..."
              value={searchQuery}
              onValueChange={updateQuery}
              data-testid="people-search-input"
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
              
              {!isLoading && !isDebouncing && debouncedQuery.length >= 2 && people.length === 0 && (
                <CommandEmpty>No people found.</CommandEmpty>
              )}
              
              {!isLoading && !isDebouncing && debouncedQuery.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
              )}

              {people.length > 0 && (
                <CommandGroup>
                  {people.slice(0, 20).map((person: Person) => {
                    const isSelected = value.includes(person.id);
                    return (
                      <CommandItem
                        key={person.id}
                        value={person.name}
                        onSelect={() => handleSelect(person)}
                        className="flex items-center justify-between"
                        data-testid={`person-option-${person.id}`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="font-medium">{person.name}</div>
                            {person.known_for_department && (
                              <div className="text-xs text-muted-foreground">
                                {person.known_for_department}
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
      {debouncedQuery.length >= 2 && !isLoading && !isDebouncing && people.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing first 20 results. Be more specific for better results.
        </p>
      )}
    </div>
  );
}