import { useParams } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MovieCard from "@/components/movie/movie-card";
import MovieCardSkeleton from "@/components/movie/movie-card-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Film, 
  Tv, 
  Users, 
  Award,
  ExternalLink
} from "lucide-react";

interface PersonData {
  person: {
    id: number;
    name: string;
    biography: string;
    birthday: string;
    deathday?: string;
    place_of_birth: string;
    profile_path: string;
    known_for_department: string;
    popularity: number;
    also_known_as: string[];
    homepage?: string;
  };
  movieCredits: {
    cast: any[];
    crew: any[];
  };
  tvCredits: {
    cast: any[];
    crew: any[];
  };
}

export default function Person() {
  const { personId } = useParams();
  const [activeTab, setActiveTab] = useState("movies");

  const { data: personData, isLoading } = useQuery<PersonData>({
    queryKey: ["/api/person", personId, "filmography"],
    enabled: !!personId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Get image URL helper
  const getImageUrl = (path: string, size: string = 'w500') => {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  };

  // Sort and filter credits
  const sortedMovieCredits = personData?.movieCredits?.cast 
    ? [...personData.movieCredits.cast]
        .filter(movie => movie.release_date) // Only include movies with release dates
        .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
    : [];

  const sortedTVCredits = personData?.tvCredits?.cast 
    ? [...personData.tvCredits.cast]
        .filter(show => show.first_air_date) // Only include shows with air dates
        .sort((a, b) => new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime())
    : [];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthday: string, deathday?: string) => {
    if (!birthday) return '';
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (!personId) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="person-not-found">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
            <p className="text-muted-foreground">The person you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="person-loading">
        <Header />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Profile skeleton */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <div className="w-full aspect-[2/3] bg-muted rounded-lg animate-pulse mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
              </div>
              {/* Content skeleton */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  <div className="h-12 bg-muted rounded animate-pulse"></div>
                  <div className="h-32 bg-muted rounded animate-pulse"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <MovieCardSkeleton key={index} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!personData) {
    return (
      <div className="min-h-screen bg-background text-foreground" data-testid="person-error">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Person</h1>
            <p className="text-muted-foreground">Unable to load person information.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { person } = personData;
  const age = calculateAge(person.birthday, person.deathday);

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="person-page">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Person Profile Sidebar */}
            <div className="lg:col-span-1" data-testid="person-profile">
              <div className="sticky top-20">
                <div className="text-center lg:text-left">
                  <div className="w-full max-w-sm mx-auto lg:mx-0 aspect-[2/3] bg-muted rounded-lg mb-6 overflow-hidden">
                    {person.profile_path ? (
                      <img
                        src={getImageUrl(person.profile_path, 'w500')}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        data-testid="person-image"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-20 h-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <h1 className="text-2xl font-display font-bold mb-4" data-testid="person-name">
                    {person.name}
                  </h1>

                  <div className="space-y-4 text-left">
                    {person.known_for_department && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Known For</h3>
                        <Badge variant="secondary" data-testid="person-department">
                          {person.known_for_department}
                        </Badge>
                      </div>
                    )}

                    {person.birthday && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Born</h3>
                        <div className="flex items-center gap-2" data-testid="person-birthday">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(person.birthday)} {age && `(age ${age})`}</span>
                        </div>
                      </div>
                    )}

                    {person.deathday && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Died</h3>
                        <div className="flex items-center gap-2" data-testid="person-deathday">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(person.deathday)}</span>
                        </div>
                      </div>
                    )}

                    {person.place_of_birth && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Place of Birth</h3>
                        <div className="flex items-center gap-2" data-testid="person-birthplace">
                          <MapPin className="w-4 h-4" />
                          <span>{person.place_of_birth}</span>
                        </div>
                      </div>
                    )}

                    {person.homepage && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-1">Website</h3>
                        <a
                          href={person.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:text-primary/80"
                          data-testid="person-website"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Official Website</span>
                        </a>
                      </div>
                    )}

                    {person.also_known_as && person.also_known_as.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Also Known As</h3>
                        <div className="flex flex-wrap gap-1" data-testid="person-aliases">
                          {person.also_known_as.slice(0, 3).map((alias, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3" data-testid="person-content">
              <div className="space-y-8">
                {/* Biography */}
                {person.biography && (
                  <section data-testid="person-biography">
                    <h2 className="text-2xl font-display font-bold mb-4">Biography</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="leading-relaxed">{person.biography}</p>
                    </div>
                    <Separator className="mt-6" />
                  </section>
                )}

                {/* Filmography */}
                <section data-testid="person-filmography">
                  <h2 className="text-2xl font-display font-bold mb-6">Filmography</h2>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                      <TabsTrigger value="movies" data-testid="tab-movies">
                        <Film className="w-4 h-4 mr-2" />
                        Movies ({sortedMovieCredits.length})
                      </TabsTrigger>
                      <TabsTrigger value="tv" data-testid="tab-tv">
                        <Tv className="w-4 h-4 mr-2" />
                        TV Shows ({sortedTVCredits.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="movies" data-testid="movies-filmography">
                      {sortedMovieCredits.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {sortedMovieCredits.map((movie: any, index: number) => (
                            <div key={`movie-${movie.id}-${movie.credit_id || index}`} className="space-y-2">
                              <MovieCard movie={movie} />
                              {movie.character && (
                                <p className="text-xs text-muted-foreground text-center">
                                  as {movie.character}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12" data-testid="empty-movies">
                          <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No movie credits found.</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="tv" data-testid="tv-filmography">
                      {sortedTVCredits.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                          {sortedTVCredits.map((show: any, index: number) => (
                            <div key={`tv-${show.id}-${show.credit_id || index}`} className="space-y-2">
                              <MovieCard movie={show} mediaType="tv" />
                              {show.character && (
                                <p className="text-xs text-muted-foreground text-center">
                                  as {show.character}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12" data-testid="empty-tv">
                          <Tv className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No TV show credits found.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}