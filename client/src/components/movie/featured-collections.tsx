import { Link } from "wouter";

export default function FeaturedCollections() {
  const collections = [
    {
      title: "Action Movies",
      description: "Explosive action and thrilling adventures",
      href: "/collection/action",
      image: "/action-collection.jpg",
      count: "500+ Movies"
    },
    {
      title: "Classic Movies",
      description: "Timeless films from cinema history",
      href: "/collection/drama",
      image: "/classic-collection.jpg",
      count: "200+ Movies"
    },
    {
      title: "Award Winners",
      description: "Oscar and Emmy winning films",
      href: "/movies?filter=top-rated",
      image: "/award-collection.jpg",
      count: "150+ Movies"
    }
  ];

  return (
    <section className="py-16 bg-accent/20" data-testid="featured-collections-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-display font-bold mb-8" data-testid="collections-title">Featured Collections</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="collections-grid">
          {collections.map((collection) => (
            <Link key={collection.href} href={collection.href} data-testid={`collection-${collection.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="group cursor-pointer interactive">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border/20 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/15 hover:scale-[1.02]">
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300">
                    <div className="absolute bottom-6 left-6 right-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-primary-light transition-colors duration-200" data-testid={`collection-title-${collection.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {collection.title}
                      </h3>
                      <p className="text-gray-200 text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-200" data-testid={`collection-description-${collection.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        {collection.count} • {collection.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
