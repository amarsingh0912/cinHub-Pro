export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function getImageUrl(path: string | null, size: 'w200' | 'w500' | 'w780' | 'original' = 'w500'): string {
  if (!path) {
    return '/placeholder-movie.jpg'; // You would add this placeholder image
  }
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function formatRating(rating: number): string {
  return (rating / 10 * 5).toFixed(1); // Convert 10-point scale to 5-point scale
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}
