import { Link } from "wouter";
import { CATEGORIES } from "@/types/movie";

export default function CategoryGrid() {
  return (
    <section className="py-16" data-testid="category-grid-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-display font-bold mb-8 text-center" data-testid="categories-title">Browse by Category</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6" data-testid="categories-grid">
          {CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/collection/${category.slug}`} data-testid={`category-${category.slug}`}>
              <div className="group cursor-pointer interactive">
                <div className={`aspect-square rounded-xl bg-gradient-to-br ${category.color} p-6 flex items-center justify-center hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 border border-white/10 backdrop-blur-sm hover:border-white/20 relative`}>
                  <category.icon className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-300" />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                <h3 className="text-center mt-4 font-semibold group-hover:text-primary transition-colors duration-200" data-testid={`category-name-${category.slug}`}>
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
