import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./movie-card";
import EnhancedMovieCard from "./enhanced-movie-card";
import MovieCardSkeleton from "./movie-card-skeleton";
import type { Movie, TVShow } from "@/types/movie";

interface ContentRowProps {
  title: string;
  items: (Movie | TVShow | (Movie & { watchProgress?: number; mediaType?: string }) | (TVShow & { watchProgress?: number; mediaType?: string }))[];
  isLoading?: boolean;
  mediaType?: "movie" | "tv";
  icon?: React.ReactNode;
  viewAllLink?: string;
  showProgress?: boolean;
  useEnhancedCards?: boolean;
}

export default function ContentRow({ 
  title, 
  items, 
  isLoading = false, 
  mediaType = "movie",
  icon,
  viewAllLink,
  showProgress = false,
  useEnhancedCards = false
}: ContentRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
      return () => {
        container.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      };
    }
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current || isScrolling) return;
    setIsScrolling(true);
    
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === "left" 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth"
    });

    setTimeout(() => setIsScrolling(false), 500);
  };

  return (
    <div className="group relative py-8" data-testid={`content-row-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary">{icon}</div>}
          <h2 className="text-2xl md:text-3xl font-bold" data-testid={`row-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h2>
        </div>
        {viewAllLink && !isLoading && (
          <a 
            href={viewAllLink}
            className="text-sm font-medium text-primary hover:underline hidden md:block"
            data-testid={`link-view-all-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            View All →
          </a>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            disabled={isScrolling}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ml-2 disabled:opacity-50"
            aria-label="Scroll left"
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 sm:px-6 lg:px-8 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          data-testid="scroll-container"
        >
          {isLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex-none w-[140px] sm:w-[180px] md:w-[200px] snap-start">
                <MovieCardSkeleton />
              </div>
            ))
          ) : (
            items.map((item) => {
              const movieItem = item as Movie;
              const watchProgress = 'watchProgress' in item ? item.watchProgress : undefined;
              const itemMediaType = ('mediaType' in item && item.mediaType) ? item.mediaType as "movie" | "tv" : mediaType;
              
              return (
                <div 
                  key={item.id} 
                  className="flex-none w-[140px] sm:w-[180px] md:w-[200px] snap-start"
                  data-testid={`card-${item.id}`}
                >
                  {useEnhancedCards ? (
                    <EnhancedMovieCard 
                      movie={movieItem} 
                      mediaType={itemMediaType} 
                      watchProgress={watchProgress}
                      showProgress={showProgress}
                    />
                  ) : (
                    <MovieCard movie={item} mediaType={itemMediaType} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {canScrollRight && !isLoading && (
          <button
            onClick={() => scroll("right")}
            disabled={isScrolling}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/70 backdrop-blur-sm hover:bg-black/90 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity mr-2 disabled:opacity-50"
            aria-label="Scroll right"
            data-testid="button-scroll-right"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
