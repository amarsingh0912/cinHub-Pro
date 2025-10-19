import { http, HttpResponse } from 'msw';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Mock movie data
const mockMovie = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
  adult: false,
  original_language: 'en',
  genre_ids: [18],
  genres: [{ id: 18, name: 'Drama' }],
  popularity: 63.869,
  release_date: '1999-10-15',
  video: false,
  vote_average: 8.433,
  vote_count: 26280,
  runtime: 139,
  status: 'Released',
  tagline: 'Mischief. Mayhem. Soap.',
  budget: 63000000,
  revenue: 100853753,
};

const mockMovies = [
  mockMovie,
  {
    id: 551,
    title: 'Another Movie',
    original_title: 'Another Movie',
    overview: 'A great movie',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    adult: false,
    original_language: 'en',
    genre_ids: [28, 12],
    popularity: 50.0,
    release_date: '2020-01-01',
    video: false,
    vote_average: 7.5,
    vote_count: 1000,
  },
];

const mockTVShow = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  overview: 'A high school chemistry teacher turned meth cook.',
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  adult: false,
  original_language: 'en',
  genre_ids: [18, 80],
  genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
  popularity: 369.594,
  first_air_date: '2008-01-20',
  vote_average: 8.9,
  vote_count: 12345,
  origin_country: ['US'],
  number_of_seasons: 5,
  number_of_episodes: 62,
  status: 'Ended',
  type: 'Scripted',
};

const mockPerson = {
  id: 6193,
  name: 'Leonardo DiCaprio',
  original_name: 'Leonardo DiCaprio',
  profile_path: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg',
  adult: false,
  popularity: 45.678,
  known_for_department: 'Acting',
  gender: 2,
};

const mockSearchResults = {
  page: 1,
  total_pages: 10,
  total_results: 200,
  results: [
    { ...mockTVShow, media_type: 'tv' },
    { ...mockMovie, media_type: 'movie' },
  ],
};

export const tmdbHandlers = [
  // Movie details
  http.get(`${TMDB_BASE_URL}/movie/:id`, ({ params }) => {
    const { id } = params;
    if (id === '550' || id === '551') {
      return HttpResponse.json(id === '550' ? mockMovie : mockMovies[1]);
    }
    return HttpResponse.json({ success: false, status_code: 34, status_message: 'The resource you requested could not be found.' }, { status: 404 });
  }),

  // TV details
  http.get(`${TMDB_BASE_URL}/tv/:id`, ({ params }) => {
    const { id } = params;
    if (id === '1396') {
      return HttpResponse.json(mockTVShow);
    }
    return HttpResponse.json({ success: false, status_code: 34, status_message: 'The resource you requested could not be found.' }, { status: 404 });
  }),

  // Person details
  http.get(`${TMDB_BASE_URL}/person/:id`, ({ params }) => {
    const { id } = params;
    if (id === '6193') {
      return HttpResponse.json(mockPerson);
    }
    return HttpResponse.json({ success: false, status_code: 34, status_message: 'The resource you requested could not be found.' }, { status: 404 });
  }),

  // Search multi
  http.get(`${TMDB_BASE_URL}/search/multi`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const page = parseInt(url.searchParams.get('page') || '1');
    const mediaType = url.searchParams.get('media_type');

    if (!query) {
      return HttpResponse.json({ success: false, status_code: 22, status_message: 'Invalid parameters' }, { status: 400 });
    }

    let results = mockSearchResults.results;
    if (mediaType) {
      results = results.filter((r: any) => r.media_type === mediaType);
    }

    return HttpResponse.json({
      page,
      total_pages: 10,
      total_results: results.length * 10,
      results,
    });
  }),

  // Search movies
  http.get(`${TMDB_BASE_URL}/search/movie`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      page,
      total_pages: 10,
      total_results: 100,
      results: [mockMovie, mockMovies[1]],
    });
  }),

  // Search TV
  http.get(`${TMDB_BASE_URL}/search/tv`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      page,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Search person
  http.get(`${TMDB_BASE_URL}/search/person`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      page,
      total_pages: 5,
      total_results: 25,
      results: [mockPerson],
    });
  }),

  // Trending movies
  http.get(`${TMDB_BASE_URL}/trending/movie/:timeWindow`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
    });
  }),

  // Trending TV
  http.get(`${TMDB_BASE_URL}/trending/tv/:timeWindow`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Popular movies
  http.get(`${TMDB_BASE_URL}/movie/popular`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
    });
  }),

  // Popular TV
  http.get(`${TMDB_BASE_URL}/tv/popular`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Top rated movies
  http.get(`${TMDB_BASE_URL}/movie/top_rated`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
    });
  }),

  // Top rated TV
  http.get(`${TMDB_BASE_URL}/tv/top_rated`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Upcoming movies
  http.get(`${TMDB_BASE_URL}/movie/upcoming`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
      dates: {
        minimum: '2024-01-01',
        maximum: '2024-12-31',
      },
    });
  }),

  // Now playing movies
  http.get(`${TMDB_BASE_URL}/movie/now_playing`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
      dates: {
        minimum: '2024-01-01',
        maximum: '2024-12-31',
      },
    });
  }),

  // Airing today TV
  http.get(`${TMDB_BASE_URL}/tv/airing_today`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // On the air TV
  http.get(`${TMDB_BASE_URL}/tv/on_the_air`, () => {
    return HttpResponse.json({
      page: 1,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Discover movies
  http.get(`${TMDB_BASE_URL}/discover/movie`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      page,
      total_pages: 10,
      total_results: 100,
      results: mockMovies,
    });
  }),

  // Discover TV
  http.get(`${TMDB_BASE_URL}/discover/tv`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');

    return HttpResponse.json({
      page,
      total_pages: 10,
      total_results: 50,
      results: [mockTVShow],
    });
  }),

  // Movie credits
  http.get(`${TMDB_BASE_URL}/movie/:id/credits`, () => {
    return HttpResponse.json({
      id: 550,
      cast: [
        {
          id: 287,
          name: 'Brad Pitt',
          character: 'Tyler Durden',
          profile_path: '/kU3B75TyRiCgE270EyZnHjfivoq.jpg',
          order: 0,
        },
      ],
      crew: [
        {
          id: 7467,
          name: 'David Fincher',
          job: 'Director',
          department: 'Directing',
          profile_path: '/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg',
        },
      ],
    });
  }),

  // TV credits
  http.get(`${TMDB_BASE_URL}/tv/:id/credits`, () => {
    return HttpResponse.json({
      id: 1396,
      cast: [
        {
          id: 17419,
          name: 'Bryan Cranston',
          character: 'Walter White',
          profile_path: '/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg',
          order: 0,
        },
      ],
      crew: [
        {
          id: 66633,
          name: 'Vince Gilligan',
          job: 'Executive Producer',
          department: 'Production',
          profile_path: '/wSTvJGz7QbJf1HK2Mv1Cev6W9TV.jpg',
        },
      ],
    });
  }),

  // Movie videos
  http.get(`${TMDB_BASE_URL}/movie/:id/videos`, () => {
    return HttpResponse.json({
      id: 550,
      results: [
        {
          id: '639d5326c234630007f8cb6d',
          key: 'BdJKm16Co6M',
          name: 'Official Trailer',
          site: 'YouTube',
          type: 'Trailer',
          official: true,
        },
      ],
    });
  }),

  // TV videos
  http.get(`${TMDB_BASE_URL}/tv/:id/videos`, () => {
    return HttpResponse.json({
      id: 1396,
      results: [
        {
          id: '5e3e2f8b92514100153e6e4d',
          key: 'HhesaQXLuRY',
          name: 'Official Trailer',
          site: 'YouTube',
          type: 'Trailer',
          official: true,
        },
      ],
    });
  }),

  // Movie reviews
  http.get(`${TMDB_BASE_URL}/movie/:id/reviews`, () => {
    return HttpResponse.json({
      id: 550,
      page: 1,
      total_pages: 1,
      total_results: 0,
      results: [],
    });
  }),

  // TV reviews
  http.get(`${TMDB_BASE_URL}/tv/:id/reviews`, () => {
    return HttpResponse.json({
      id: 1396,
      page: 1,
      total_pages: 1,
      total_results: 0,
      results: [],
    });
  }),

  // Genres list for movies
  http.get(`${TMDB_BASE_URL}/genre/movie/list`, () => {
    return HttpResponse.json({
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 18, name: 'Drama' },
      ],
    });
  }),

  // Genres list for TV
  http.get(`${TMDB_BASE_URL}/genre/tv/list`, () => {
    return HttpResponse.json({
      genres: [
        { id: 10759, name: 'Action & Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 18, name: 'Drama' },
      ],
    });
  }),
];
