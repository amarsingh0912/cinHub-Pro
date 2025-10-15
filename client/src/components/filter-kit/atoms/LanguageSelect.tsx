import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Language } from "@/types/filters";

interface LanguageSelectProps {
  value?: string;
  onValueChange: (value?: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function LanguageSelect({ value, onValueChange, placeholder = "All languages", className, id }: LanguageSelectProps) {
  const { data: languages, isLoading } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
  });

  const selectedLanguage = languages?.find(lang => lang.iso_639_1 === value);

  return (
    <Select
      value={value || 'all'}
      onValueChange={(val) => onValueChange(val === 'all' ? undefined : val)}
    >
      <SelectTrigger id={id} className={className} data-testid="select-language">
        <SelectValue>
          {isLoading ? 'Loading...' : selectedLanguage?.english_name || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" data-testid="language-all">
          {placeholder}
        </SelectItem>
        {languages?.map((language) => (
          <SelectItem
            key={language.iso_639_1}
            value={language.iso_639_1}
            data-testid={`language-${language.iso_639_1}`}
          >
            {language.english_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
