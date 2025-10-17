import { useEffect, useRef, useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Film, Heart, Users, Star, Zap, Shield, Award, Target, Eye, Lightbulb, ArrowRight, PlayCircle } from "lucide-react";

// Custom hook for animated counters
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (startTime === undefined) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * target));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, target, duration]);

  return { count, countRef };
}

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
    { number: 1000000, label: "Movies", displayTarget: 1, suffix: "M+", icon: Film },
    { number: 50000, label: "Active Users", displayTarget: 50, suffix: "K+", icon: Users },
    { number: 100000, label: "Reviews", displayTarget: 100, suffix: "K+", icon: Star },
    { number: 500000, label: "Watchlists", displayTarget: 500, suffix: "K+", icon: Heart }
  ];

  // Initialize animated counters for each stat using correct display targets
  const movieCount = useCountUp(stats[0].displayTarget, 2000);
  const userCount = useCountUp(stats[1].displayTarget, 2500);
  const reviewCount = useCountUp(stats[2].displayTarget, 2200);
  const watchlistCount = useCountUp(stats[3].displayTarget, 2800);

  const counters = [movieCount, userCount, reviewCount, watchlistCount];

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
        <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5" data-testid="about-stats">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-center mb-4" data-testid="stats-title">
              Platform Statistics
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Join thousands of movie enthusiasts in our growing community
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:scale-105" data-testid={`stat-${index}`}>
                  <CardContent className="pt-8 pb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-secondary group-hover:to-primary transition-all duration-300">
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div 
                      ref={counters[index].countRef}
                      className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2" 
                      data-testid={`stat-number-${index}`}
                    >
                      {counters[index].count}{stat.suffix}
                    </div>
                    <div className="text-muted-foreground font-medium" data-testid={`stat-label-${index}`}>
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
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
                <div className="font-semibold">JWT Auth</div>
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

        {/* Company Values Section */}
        <section className="py-16 bg-gradient-to-r from-accent/10 to-muted/10" data-testid="about-values">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="values-title">
                Our Core Values
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="values-description">
                The principles that guide everything we do at CineHub Pro
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur-sm" data-testid="value-passion">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Passion</h3>
                  <p className="text-muted-foreground">We're passionate about cinema and committed to sharing that love with our community.</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur-sm" data-testid="value-innovation">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                  <p className="text-muted-foreground">Constantly evolving our platform with cutting-edge features and user experiences.</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur-sm" data-testid="value-community">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Community</h3>
                  <p className="text-muted-foreground">Building connections between movie lovers worldwide through shared experiences.</p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur-sm" data-testid="value-excellence">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Excellence</h3>
                  <p className="text-muted-foreground">Delivering the highest quality movie discovery experience with attention to detail.</p>
                </CardContent>
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-2xl">
                    <Film className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 text-center" data-testid="team-message-title">
                  Join Our Community
                </h3>
                <p className="text-lg text-muted-foreground mb-6 text-center" data-testid="team-message">
                  Whether you're a casual movie watcher or a dedicated cinephile, CineHub Pro is designed for you. 
                  Join thousands of users who have already made CineHub Pro their go-to platform for movie discovery.
                </p>
                <div className="flex justify-center space-x-4">
                  <Badge variant="outline" className="text-sm px-4 py-2">
                    Version 2.0.0
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-4 py-2">
                    Production Ready
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" data-testid="team-commitment-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">Our Commitment</h4>
                        <p className="text-muted-foreground">
                          We're committed to continuously improving CineHub Pro based on user feedback 
                          and the latest web technologies to provide the best possible experience.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" data-testid="team-vision-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                        <Eye className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold mb-2">Future Vision</h4>
                        <p className="text-muted-foreground">
                          We're working on exciting new features including AI-powered recommendations, 
                          social features, and enhanced discovery tools to make finding your next favorite movie even easier.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button className="group bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300" data-testid="team-get-started-btn">
                    Get Started Today
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
