import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Film, Heart, Users, Star, Zap, Shield } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: Film,
      title: "Extensive Movie Database",
      description: "Access to millions of movies powered by TMDB with detailed information, cast, crew, and ratings."
    },
    {
      icon: Heart,
      title: "Personal Collections",
      description: "Create custom watchlists, mark favorites, and organize your movie preferences your way."
    },
    {
      icon: Star,
      title: "Rate & Review",
      description: "Share your thoughts with the community by rating and reviewing movies you've watched."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with fellow movie enthusiasts and discover new films through community recommendations."
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Stay up-to-date with the latest releases, trending movies, and what's popular right now."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is secure with modern authentication and privacy controls for your collections."
    }
  ];

  const stats = [
    { number: "1M+", label: "Movies" },
    { number: "50K+", label: "Active Users" },
    { number: "100K+", label: "Reviews" },
    { number: "500K+", label: "Watchlists" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="about-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="about-hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <Film className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-6" data-testid="about-title">
              About CineHub Pro
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="about-description">
              CineHub Pro is your ultimate destination for movie discovery and collection management. 
              Built with passion for cinema, we help movie enthusiasts discover, organize, and share 
              their love for films with a vibrant community of like-minded individuals.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16" data-testid="about-mission">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display font-bold mb-6" data-testid="mission-title">
                  Our Mission
                </h2>
                <p className="text-lg text-muted-foreground mb-6" data-testid="mission-description">
                  We believe that every movie has a story to tell, and every viewer has a unique perspective to share. 
                  CineHub Pro was created to bridge the gap between movie discovery and community engagement, 
                  making it easier for film lovers to find their next favorite movie and connect with others who share their passion.
                </p>
                <p className="text-lg text-muted-foreground" data-testid="mission-vision">
                  Our platform combines the comprehensive movie database from TMDB with powerful personalization features, 
                  creating a space where movie discovery becomes an adventure and sharing your thoughts enriches the entire community.
                </p>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1489599210478-b875496ba62e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
                  alt="People enjoying movies in a cinema"
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-card/30" data-testid="about-stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-center mb-12" data-testid="stats-title">
              Platform Statistics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="text-4xl font-bold text-primary mb-2" data-testid={`stat-number-${index}`}>
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground" data-testid={`stat-label-${index}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16" data-testid="about-features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="features-title">
                What Makes Us Special
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="features-description">
                Discover the features that make CineHub Pro the perfect platform for movie enthusiasts
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow" data-testid={`feature-${index}`}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3" data-testid={`feature-title-${index}`}>
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground" data-testid={`feature-description-${index}`}>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 bg-accent/20" data-testid="about-technology">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="tech-title">
                Built with Modern Technology
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="tech-description">
                CineHub Pro is built using cutting-edge technologies to provide you with a fast, reliable, and secure experience
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="text-center p-4" data-testid="tech-react">
                <Badge variant="secondary" className="mb-2">Frontend</Badge>
                <div className="font-semibold">React</div>
                <div className="text-sm text-muted-foreground">Modern UI Framework</div>
              </Card>
              
              <Card className="text-center p-4" data-testid="tech-express">
                <Badge variant="secondary" className="mb-2">Backend</Badge>
                <div className="font-semibold">Express.js</div>
                <div className="text-sm text-muted-foreground">Server Framework</div>
              </Card>
              
              <Card className="text-center p-4" data-testid="tech-postgres">
                <Badge variant="secondary" className="mb-2">Database</Badge>
                <div className="font-semibold">PostgreSQL</div>
                <div className="text-sm text-muted-foreground">Reliable Data Storage</div>
              </Card>
              
              <Card className="text-center p-4" data-testid="tech-tmdb">
                <Badge variant="secondary" className="mb-2">Data</Badge>
                <div className="font-semibold">TMDB API</div>
                <div className="text-sm text-muted-foreground">Movie Database</div>
              </Card>
              
              <Card className="text-center p-4" data-testid="tech-auth">
                <Badge variant="secondary" className="mb-2">Auth</Badge>
                <div className="font-semibold">Replit Auth</div>
                <div className="text-sm text-muted-foreground">Secure Login</div>
              </Card>
              
              <Card className="text-center p-4" data-testid="tech-tailwind">
                <Badge variant="secondary" className="mb-2">Styling</Badge>
                <div className="font-semibold">Tailwind CSS</div>
                <div className="text-sm text-muted-foreground">Modern Design</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16" data-testid="about-team">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="team-title">
                Built by Movie Enthusiasts
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="team-description">
                CineHub Pro is developed by a passionate team of developers and movie lovers who understand 
                what makes a great movie discovery platform
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <Film className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-4" data-testid="team-message-title">
                Join Our Community
              </h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto" data-testid="team-message">
                Whether you're a casual movie watcher or a dedicated cinephile, CineHub Pro is designed for you. 
                Join thousands of users who have already made CineHub Pro their go-to platform for movie discovery.
              </p>
              <Badge variant="outline" className="text-lg px-6 py-2">
                Version 2.0.0 - Production Ready
              </Badge>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
