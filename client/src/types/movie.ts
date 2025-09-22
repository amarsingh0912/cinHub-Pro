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
  similar?: MovieResponse;
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

export interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface SearchResponse extends MovieResponse {}

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

export const CATEGORIES = [
  { name: 'Action', slug: 'action', icon: 'mask', color: 'from-red-500 to-red-600' },
  { name: 'Romance', slug: 'romance', icon: 'heart', color: 'from-pink-500 to-pink-600' },
  { name: 'Sci-Fi', slug: 'science-fiction', icon: 'robot', color: 'from-blue-500 to-blue-600' },
  { name: 'Horror', slug: 'horror', icon: 'ghost', color: 'from-purple-500 to-purple-600' },
  { name: 'Comedy', slug: 'comedy', icon: 'laugh', color: 'from-green-500 to-green-600' },
  { name: 'Adventure', slug: 'adventure', icon: 'mountain', color: 'from-orange-500 to-orange-600' },
];
