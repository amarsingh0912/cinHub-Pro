// Type definition for RecommendationCarousel component

interface RecommendationCarouselProps {
  title: string;
  endpoint: string;
  onMovieClick?: (movie: any) => void;
}

declare module '@/components/RecommendationCarousel' {
  export default function RecommendationCarousel(props: RecommendationCarouselProps): JSX.Element;
}
