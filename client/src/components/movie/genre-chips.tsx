import { useState } from "react";
import { CATEGORIES } from "@/types/movie";
import { Button } from "@/components/ui/button";

interface GenreChipsProps {
  onGenreChange?: (genre: string | null) => void;
  selectedGenre?: string | null;
}

export default function GenreChips({ onGenreChange, selectedGenre = null }: GenreChipsProps) {
  const [activeGenre, setActiveGenre] = useState<string | null>(selectedGenre);

  const handleGenreClick = (slug: string) => {
    if (slug === "all") {
      setActiveGenre(null);
      onGenreChange?.(null);
      return;
    }
    const newGenre = activeGenre === slug ? null : slug;
    setActiveGenre(newGenre);
    onGenreChange?.(newGenre);
  };

  return (
    <div className="py-6 bg-background/50 backdrop-blur-sm border-y border-border" data-testid="genre-chips">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          <Button
            variant={activeGenre === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleGenreClick("all")}
            className="flex-shrink-0 transition-all"
            data-testid="chip-all"
          >
            All
          </Button>
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeGenre === category.slug;
            return (
              <Button
                key={category.slug}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleGenreClick(category.slug)}
                className="flex-shrink-0 gap-2 transition-all"
                data-testid={`chip-${category.slug}`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
