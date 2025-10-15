import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Country } from "@/types/filters";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value?: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function CountrySelect({ value, onValueChange, placeholder = "All countries", className, id }: CountrySelectProps) {
  const { data: countries, isLoading } = useQuery<Country[]>({
    queryKey: ['/api/countries'],
  });

  const selectedCountry = countries?.find(country => country.iso_3166_1 === value);

  return (
    <Select
      value={value || 'all'}
      onValueChange={(val) => onValueChange(val === 'all' ? undefined : val)}
    >
      <SelectTrigger id={id} className={className} data-testid="select-country">
        <SelectValue>
          {isLoading ? 'Loading...' : selectedCountry?.english_name || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" data-testid="country-all">
          {placeholder}
        </SelectItem>
        {countries?.map((country) => (
          <SelectItem
            key={country.iso_3166_1}
            value={country.iso_3166_1}
            data-testid={`country-${country.iso_3166_1}`}
          >
            {country.english_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
