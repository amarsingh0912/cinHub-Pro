import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, ChevronLeft, ChevronRight, Maximize2, Calendar, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
  published_at?: string;
}

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
  title: string;
}

export default function TrailerModal({ isOpen, onClose, videos, title }: TrailerModalProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState<Set<number>>(new Set());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!videos || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentVideoIndex];
  const hasMultipleVideos = videos.length > 1;

  const goToNext = () => {
    setIsLoading(true);
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const goToPrevious = () => {
    setIsLoading(true);
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleVideoSelect = (index: number) => {
    if (index !== currentVideoIndex) {
      setIsLoading(true);
      setCurrentVideoIndex(index);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => {
        setCurrentVideoIndex(0);
        setWatchedVideos(new Set());
        setIsLoading(true);
      }, 300);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowRight':
          if (hasMultipleVideos) {
            e.preventDefault();
            goToNext();
          }
          break;
        case 'ArrowLeft':
          if (hasMultipleVideos) {
            e.preventDefault();
            goToPrevious();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasMultipleVideos]);

  // Track watched videos
  useEffect(() => {
    if (isOpen) {
      setWatchedVideos(prev => new Set(prev).add(currentVideoIndex));
    }
  }, [currentVideoIndex, isOpen]);

  // Reset loading state after video changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentVideoIndex, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-7xl w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] h-[95vh] sm:h-[90vh] p-0 gap-0 bg-black/98 border-border/30 backdrop-blur-xl overflow-y-auto flex flex-col"
        data-testid="trailer-modal"
      >
        <VisuallyHidden>
          <DialogTitle>{currentVideo.name}</DialogTitle>
          <DialogDescription>Watch {currentVideo.type} for {title}</DialogDescription>
        </VisuallyHidden>
        
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center"
          onClick={onClose}
          aria-label="Close trailer modal"
          title="Close trailer modal"
          data-testid="button-close-trailer"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Fullscreen Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-16 top-2 sm:right-16 sm:top-4 z-50 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center"
          onClick={handleFullscreen}
          aria-label="Enter fullscreen mode"
          title="Enter fullscreen mode"
          data-testid="button-fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Loading video...</p>
              </div>
            </div>
          )}
          
          <iframe
            ref={iframeRef}
            key={currentVideo.key}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideo.key}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&color=white&playsinline=1`}
            title={currentVideo.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            data-testid="trailer-iframe"
            onLoad={() => setIsLoading(false)}
          />

          {/* Navigation Arrows for Multiple Videos */}
          {hasMultipleVideos && !isLoading && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center"
                onClick={goToPrevious}
                aria-label="Previous video"
                title="Previous video"
                data-testid="button-previous-video"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center"
                onClick={goToNext}
                aria-label="Next video"
                title="Next video"
                data-testid="button-next-video"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Video Counter Overlay */}
          {hasMultipleVideos && (
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs sm:text-sm font-medium">
              {currentVideoIndex + 1} / {videos.length}
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="bg-gradient-to-b from-background/98 to-background/95 backdrop-blur-md p-4 sm:p-6 space-y-4 sm:space-y-5 border-t border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 line-clamp-2" data-testid="trailer-title">
                {currentVideo.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold px-2.5 py-1"
                  data-testid="trailer-type"
                >
                  <Film className="w-3 h-3 mr-1" />
                  {currentVideo.type}
                </Badge>
                {currentVideo.official && (
                  <Badge 
                    variant="default" 
                    className="bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold px-2.5 py-1" 
                    data-testid="trailer-official"
                  >
                    ✓ Official
                  </Badge>
                )}
                {currentVideo.published_at && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2.5 py-1"
                    data-testid="trailer-date"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(currentVideo.published_at)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground" data-testid="trailer-from">
                From: {title}
              </p>
            </div>
          </div>

          {/* Video Icons/List for Multiple Videos */}
          {hasMultipleVideos && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">More Videos</h4>
                <span className="text-xs text-muted-foreground">
                  {watchedVideos.size} of {videos.length} viewed
                </span>
              </div>
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-3">
                  {videos.map((video, index) => {
                    const isWatched = watchedVideos.has(index);
                    const isCurrent = index === currentVideoIndex;
                    
                    return (
                      <button
                        key={video.id}
                        onClick={() => handleVideoSelect(index)}
                        aria-label={`Play ${video.name}`}
                        title={video.name}
                        className="relative flex-shrink-0 flex flex-col items-center gap-2 w-24 group"
                        data-testid={`video-thumbnail-${index}`}
                      >
                        {/* Video Icon */}
                        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCurrent
                            ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                            : "border-border/50 bg-background/50 hover:border-primary/70 hover:bg-primary/10"
                        }`}>
                          <Play className={`w-7 h-7 transition-all duration-300 ${
                            isCurrent 
                              ? "text-primary fill-primary" 
                              : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                          }`} />
                          
                          {/* Current Indicator */}
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            </div>
                          )}
                          
                          {/* Viewed Indicator */}
                          {isWatched && !isCurrent && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-[8px] text-white">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Video Title */}
                        <div className="w-full text-center">
                          <p className={`text-xs font-medium line-clamp-2 transition-colors duration-200 ${
                            isCurrent 
                              ? "text-primary" 
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}>
                            {video.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Keyboard Shortcuts Hint */}
          {hasMultipleVideos && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Use <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted rounded">←</kbd> and <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted rounded">→</kbd> to navigate • <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted rounded">ESC</kbd> to close
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
