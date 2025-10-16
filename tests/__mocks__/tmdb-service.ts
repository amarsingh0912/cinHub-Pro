import { vi } from 'vitest';

// Mock TMDB responses
export const mockMovieDetails = {
  id: 550,
  title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman...',
  release_date: '1999-10-15',
  runtime: 139,
  vote_average: 8.4,
  vote_count: 26280,
  poster_path: '/path/to/poster.jpg',
  backdrop_path: '/path/to/backdrop.jpg',
  genres: [
    { id: 18, name: 'Drama' }
  ],
  credits: {
    cast: [
      { id: 287, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: '/path.jpg' }
    ],
    crew: [
      { id: 7467, name: 'David Fincher', job: 'Director', profile_path: '/path.jpg' }
    ]
  },
  videos: { results: [] },
  similar: { results: [] },
  recommendations: { results: [] }
};

export const mockTVDetails = {
  id: 1399,
  name: 'Game of Thrones',
  overview: 'Seven noble families fight for control...',
  first_air_date: '2011-04-17',
  number_of_seasons: 8,
  number_of_episodes: 73,
  vote_average: 8.3,
  poster_path: '/path/to/poster.jpg',
  backdrop_path: '/path/to/backdrop.jpg',
  genres: [
    { id: 10765, name: 'Sci-Fi & Fantasy' }
  ],
  credits: { cast: [], crew: [] },
  videos: { results: [] }
};

export const mockMoviesList = {
  page: 1,
  results: [
    {
      id: 550,
      title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac...',
      poster_path: '/path/to/poster.jpg',
      backdrop_path: '/path/to/backdrop.jpg',
      vote_average: 8.4,
      release_date: '1999-10-15',
      genre_ids: [18, 53]
    }
  ],
  total_pages: 100,
  total_results: 2000
};

export const mockTVList = {
  page: 1,
  results: [
    {
      id: 1399,
      name: 'Game of Thrones',
      overview: 'Seven noble families...',
      poster_path: '/path/to/poster.jpg',
      backdrop_path: '/path/to/backdrop.jpg',
      vote_average: 8.3,
      first_air_date: '2011-04-17',
      genre_ids: [10765, 18]
    }
  ],
  total_pages: 50,
  total_results: 1000
};

// Mock TMDB service
export const mockTMDBService = {
  getMovie: vi.fn().mockResolvedValue(mockMovieDetails),
  getTVShow: vi.fn().mockResolvedValue(mockTVDetails),
  getTrending: vi.fn().mockResolvedValue(mockMoviesList),
  getPopular: vi.fn().mockResolvedValue(mockMoviesList),
  discover: vi.fn().mockResolvedValue(mockMoviesList),
  search: vi.fn().mockResolvedValue(mockMoviesList),
};

// Mock Cloudinary service
export const mockCloudinaryService = {
  uploadImage: vi.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    public_id: 'sample'
  }),
  deleteImage: vi.fn().mockResolvedValue(true),
};
