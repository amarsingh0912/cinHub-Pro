import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  if (!videos || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentVideoIndex];
  const hasMultipleVideos = videos.length > 1;

  const goToNext = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const goToPrevious = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTimeout(() => setCurrentVideoIndex(0), 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-6xl w-full p-0 gap-0 bg-black/95 border-border/50"
        data-testid="trailer-modal"
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 hover:bg-black/80 text-white"
          onClick={onClose}
          data-testid="button-close-trailer"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            key={currentVideo.key}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentVideo.key}?autoplay=1&rel=0&modestbranding=1`}
            title={currentVideo.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
            data-testid="trailer-iframe"
          />

          {/* Navigation Arrows for Multiple Videos */}
          {hasMultipleVideos && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 hover:bg-black/80 text-white"
                onClick={goToPrevious}
                data-testid="button-previous-video"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 hover:bg-black/80 text-white"
                onClick={goToNext}
                data-testid="button-next-video"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Video Info */}
        <div className="bg-background/95 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-foreground mb-2 truncate" data-testid="trailer-title">
                {currentVideo.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" data-testid="trailer-type">
                  {currentVideo.type}
                </Badge>
                {currentVideo.official && (
                  <Badge variant="default" className="bg-primary/20 text-primary" data-testid="trailer-official">
                    Official
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground" data-testid="trailer-from">
                  {title}
                </span>
              </div>
            </div>
            {hasMultipleVideos && (
              <div className="text-sm text-muted-foreground whitespace-nowrap" data-testid="video-counter">
                {currentVideoIndex + 1} / {videos.length}
              </div>
            )}
          </div>

          {/* Video Thumbnails/List for Multiple Videos */}
          {hasMultipleVideos && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">More Videos</h4>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-2">
                  {videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                        index === currentVideoIndex
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/50"
                      }`}
                      data-testid={`video-thumbnail-${index}`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-xs text-white line-clamp-1">{video.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
