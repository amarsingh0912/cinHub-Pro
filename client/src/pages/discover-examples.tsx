/**
 * Discover Examples Page
 * Demonstrates comprehensive TMDB Discover API filter combinations
 */

import { useDiscoverMoviesCustom, buildMovieFilters } from '@/hooks/useDiscoverMovies';
import { useDiscoverTvShowsCustom, buildTVFilters } from '@/hooks/useDiscoverTvShows';
import MovieGrid from '@/components/movie/movie-grid';
import MovieGridSkeleton from '@/components/movie/movie-grid-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Star, Film, Tv, Globe, Users } from 'lucide-react';

export default function DiscoverExamplesPage() {
  const today = new Date().toISOString().split('T')[0];

  // Example 1: Upcoming Movies in India
  const upcomingIndia = useDiscoverMoviesCustom(buildMovieFilters({
    region: 'IN',
    sort_by: 'primary_release_date.asc',
    'primary_release_date.gte': today,
    with_release_type: '2|3', // Theatrical releases
  }));

  // Example 2: Highly Rated Sci-Fi Movies
  const sciFiMovies = useDiscoverMoviesCustom(buildMovieFilters({
    with_genres: '878', // Sci-Fi genre ID
    'vote_average.gte': 8,
    sort_by: 'vote_average.desc',
    'vote_count.gte': 1000,
  }));

  // Example 3: Family-Friendly Animated Movies
  const familyAnimated = useDiscoverMoviesCustom(buildMovieFilters({
    with_genres: '16|10751', // Animation OR Family
    certification_country: 'US',
    certification: 'PG',
    sort_by: 'popularity.desc',
  }));

  // Example 4: Currently Airing TV Shows
  const airingToday = useDiscoverTvShowsCustom(buildTVFilters({
    'air_date.gte': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    'air_date.lte': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    sort_by: 'popularity.desc',
  }));

  // Example 5: Top Rated Dramas
  const topDramas = useDiscoverTvShowsCustom(buildTVFilters({
    with_genres: '18', // Drama genre ID
    'vote_average.gte': 8,
    'vote_count.gte': 200,
    sort_by: 'vote_average.desc',
  }));

  // Example 6: Trending Netflix Originals
  const netflixOriginals = useDiscoverTvShowsCustom(buildTVFilters({
    with_networks: '213', // Netflix network ID
    sort_by: 'popularity.desc',
    'first_air_date.gte': '2024-01-01',
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-discover-examples">
            TMDB Discover API Examples
          </h1>
          <p className="text-muted-foreground" data-testid="text-description">
            Comprehensive filtering and data-fetching examples using The Movie Database Discover API
          </p>
        </div>

        {/* Tabs for Movies and TV Shows */}
        <Tabs defaultValue="movies" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8" data-testid="tabs-content-type">
            <TabsTrigger value="movies" data-testid="tab-movies">
              <Film className="mr-2 h-4 w-4" />
              Movies
            </TabsTrigger>
            <TabsTrigger value="tv" data-testid="tab-tv">
              <Tv className="mr-2 h-4 w-4" />
              TV Shows
            </TabsTrigger>
          </TabsList>

          {/* Movies Examples */}
          <TabsContent value="movies" className="space-y-12">
            {/* Example 1: Upcoming Movies in India */}
            <Card data-testid="card-upcoming-india">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Movies in India
                    </CardTitle>
                    <CardDescription>
                      Movies releasing soon in India (theatrical releases only)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-region">
                    <Globe className="mr-1 h-3 w-3" />
                    India
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-upcoming-india">
                    region=IN&sort_by=primary_release_date.asc&primary_release_date.gte={today}&with_release_type=2|3
                  </code>
                </div>
                {upcomingIndia.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={upcomingIndia.data?.results || []} />
                )}
              </CardContent>
            </Card>

            {/* Example 2: Highly Rated Sci-Fi Movies */}
            <Card data-testid="card-scifi-movies">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Highly Rated Sci-Fi Movies
                    </CardTitle>
                    <CardDescription>
                      Science fiction movies with 8+ rating and 1000+ votes
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-scifi">
                    Genre: Sci-Fi
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-scifi">
                    with_genres=878&vote_average.gte=8&sort_by=vote_average.desc&vote_count.gte=1000
                  </code>
                </div>
                {sciFiMovies.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={sciFiMovies.data?.results || []} />
                )}
              </CardContent>
            </Card>

            {/* Example 3: Family-Friendly Animated Movies */}
            <Card data-testid="card-family-animated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Family-Friendly Animated Movies
                    </CardTitle>
                    <CardDescription>
                      Animated or family movies rated PG or below in the US
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-family">
                    PG & Below
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-family">
                    with_genres=16|10751&certification_country=US&certification.lte=PG&sort_by=popularity.desc
                  </code>
                </div>
                {familyAnimated.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={familyAnimated.data?.results || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TV Shows Examples */}
          <TabsContent value="tv" className="space-y-12">
            {/* Example 4: Currently Airing TV Shows */}
            <Card data-testid="card-airing-today">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Currently Airing TV Shows
                    </CardTitle>
                    <CardDescription>
                      TV shows airing in the past and next 7 days
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-airing">
                    On Air
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-airing">
                    air_date.gte={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&air_date.lte={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&sort_by=popularity.desc
                  </code>
                </div>
                {airingToday.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={airingToday.data?.results as any || []} />
                )}
              </CardContent>
            </Card>

            {/* Example 5: Top Rated Dramas */}
            <Card data-testid="card-top-dramas">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Top Rated Dramas
                    </CardTitle>
                    <CardDescription>
                      Drama TV shows with 8+ rating and 200+ votes
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-drama">
                    Genre: Drama
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-drama">
                    with_genres=18&vote_average.gte=8&vote_count.gte=200&sort_by=vote_average.desc
                  </code>
                </div>
                {topDramas.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={topDramas.data?.results as any || []} />
                )}
              </CardContent>
            </Card>

            {/* Example 6: Trending Netflix Originals */}
            <Card data-testid="card-netflix-originals">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tv className="h-5 w-5" />
                      Trending Netflix Originals
                    </CardTitle>
                    <CardDescription>
                      Popular Netflix shows that first aired in 2024 or later
                    </CardDescription>
                  </div>
                  <Badge variant="outline" data-testid="badge-netflix">
                    Netflix
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <code className="text-sm" data-testid="code-netflix">
                    with_networks=213&sort_by=popularity.desc&first_air_date.gte=2024-01-01
                  </code>
                </div>
                {netflixOriginals.isLoading ? (
                  <MovieGridSkeleton count={4} />
                ) : (
                  <MovieGrid movies={netflixOriginals.data?.results as any || []} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Information */}
        <Card className="mt-12" data-testid="card-implementation">
          <CardHeader>
            <CardTitle>Implementation Details</CardTitle>
            <CardDescription>
              How to use the unified filtering and data-fetching system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Filter Logic</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>|</code> (pipe) = OR logic: matches any of the values</li>
                <li><code>,</code> (comma) = AND logic: matches all of the values</li>
                <li>Example: <code>with_genres=16|10751</code> means Animation OR Family</li>
                <li>Example: <code>with_cast=500,190</code> means Leonardo DiCaprio AND Samuel L. Jackson</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Available Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Movies:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>with_genres, without_genres</li>
                    <li>with_keywords, without_keywords</li>
                    <li>with_cast, with_crew, with_people</li>
                    <li>with_companies, with_release_type</li>
                    <li>certification, certification.lte</li>
                    <li>primary_release_date.gte/lte</li>
                    <li>vote_average.gte/lte, vote_count.gte/lte</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">TV Shows:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>with_genres, without_genres</li>
                    <li>with_keywords, without_keywords</li>
                    <li>with_networks, with_companies</li>
                    <li>with_status, with_type</li>
                    <li>first_air_date.gte/lte, air_date.gte/lte</li>
                    <li>vote_average.gte/lte, vote_count.gte/lte</li>
                    <li>screened_theatrically, timezone</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
