export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface MovieDetails extends Movie {
  runtime: number;
  budget: number;
  revenue: number;
  tagline: string;
  homepage: string;
  imdb_id: string;
  status: string;
  genres: Genre[];
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  credits?: Credits;
  videos?: Videos;
  images?: Images;
  similar?: MovieResponse;
  recommendations?: MovieResponse;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Videos {
  results: Video[];
}

export interface Video {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface ImageItem {
  aspect_ratio: number;
  file_path: string;
  height: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface Images {
  backdrops: ImageItem[];
  logos: ImageItem[];
  posters: ImageItem[];
}

export interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface SearchResponse extends MovieResponse {}

// TV Show interfaces
export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_name: string;
  popularity: number;
  origin_country: string[];
}

export interface TVShowDetails extends TVShow {
  number_of_episodes: number;
  number_of_seasons: number;
  episode_run_time: number[];
  first_air_date: string;
  last_air_date: string;
  tagline: string;
  homepage: string;
  status: string;
  type: string;
  genres: Genre[];
  created_by: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  networks: Array<{
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }>;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  spoken_languages: SpokenLanguage[];
  seasons: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string;
  }>;
  credits?: Credits;
  videos?: Videos;
  images?: Images;
  similar?: TVResponse;
  recommendations?: TVResponse;
}

export interface TVResponse {
  page: number;
  results: TVShow[];
  total_pages: number;
  total_results: number;
}

export const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'science-fiction': 878,
  'tv-movie': 10770,
  thriller: 53,
  war: 10752,
  western: 37
};

import { Zap, Heart, Bot, Ghost, Smile, Mountain } from 'lucide-react';

export const CATEGORIES = [
  { name: 'Action', slug: 'action', icon: Zap, color: 'from-red-500 to-red-600' },
  { name: 'Romance', slug: 'romance', icon: Heart, color: 'from-pink-500 to-pink-600' },
  { name: 'Sci-Fi', slug: 'science-fiction', icon: Bot, color: 'from-blue-500 to-blue-600' },
  { name: 'Horror', slug: 'horror', icon: Ghost, color: 'from-purple-500 to-purple-600' },
  { name: 'Comedy', slug: 'comedy', icon: Smile, color: 'from-green-500 to-green-600' },
  { name: 'Adventure', slug: 'adventure', icon: Mountain, color: 'from-orange-500 to-orange-600' },
];
