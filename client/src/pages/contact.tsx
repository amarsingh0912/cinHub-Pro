import { useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle, Phone, MapPin, Clock, Send } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for your message. We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      content: "support@cinehubpro.com",
      description: "Get help with your account or technical issues"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      content: "Available 24/7",
      description: "Chat with our support team in real-time"
    },
    {
      icon: Phone,
      title: "Phone Support",
      content: "+1 (555) 123-4567",
      description: "Call us for urgent matters"
    },
    {
      icon: Clock,
      title: "Response Time",
      content: "< 24 hours",
      description: "Average response time for all inquiries"
    }
  ];

  const faqItems = [
    {
      question: "How do I create a watchlist?",
      answer: "Sign in to your account, go to your dashboard, and click 'Create Watchlist'. You can then add movies to your custom lists."
    },
    {
      question: "Is CineHub Pro free to use?",
      answer: "Yes! CineHub Pro is completely free to use. Create an account and start discovering movies right away."
    },
    {
      question: "How do you get movie data?",
      answer: "We use The Movie Database (TMDB) API to provide comprehensive and up-to-date movie information, including ratings, cast, and plot details."
    },
    {
      question: "Can I share my watchlists?",
      answer: "Yes, you can make your watchlists public when creating them, allowing other users to discover your movie recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="contact-page">
      <Header />
      
      <main className="pt-16">
        {/* Contact Hero */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="contact-hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-6" data-testid="contact-title">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="contact-description">
              Have questions about CineHub Pro? Need help with your account? 
              We're here to help! Reach out to us through any of the methods below.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-16" data-testid="contact-info">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {contactInfo.map((info, index) => (
                <Card key={index} className="text-center group hover:shadow-lg transition-shadow" data-testid={`contact-info-${index}`}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" data-testid={`contact-info-title-${index}`}>
                      {info.title}
                    </h3>
                    <div className="text-xl font-bold text-primary mb-2" data-testid={`contact-info-content-${index}`}>
                      {info.content}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`contact-info-description-${index}`}>
                      {info.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="py-16 bg-card/30" data-testid="contact-form-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card data-testid="contact-form-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Send us a Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            required
                            data-testid="input-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your@email.com"
                            required
                            data-testid="input-email"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="What's this about?"
                          data-testid="input-subject"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Tell us how we can help you..."
                          rows={6}
                          required
                          data-testid="textarea-message"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full"
                        data-testid="button-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* FAQ Section */}
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-display font-bold mb-4" data-testid="faq-title">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-muted-foreground" data-testid="faq-description">
                    Quick answers to common questions about CineHub Pro
                  </p>
                </div>
                
                <div className="space-y-4" data-testid="faq-list">
                  {faqItems.map((faq, index) => (
                    <Card key={index} data-testid={`faq-item-${index}`}>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-3 text-lg" data-testid={`faq-question-${index}`}>
                          {faq.question}
                        </h3>
                        <p className="text-muted-foreground" data-testid={`faq-answer-${index}`}>
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="mt-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-none" data-testid="faq-help-card">
                  <CardContent className="pt-6 text-center">
                    <h3 className="font-semibold mb-2" data-testid="faq-help-title">
                      Still need help?
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid="faq-help-description">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <Button variant="outline" data-testid="button-more-help">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Office Location */}
        <section className="py-16" data-testid="contact-location">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="location-title">
                Our Location
              </h2>
              <p className="text-xl text-muted-foreground" data-testid="location-description">
                CineHub Pro is a global platform, serving movie lovers worldwide
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Card data-testid="location-info-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2" data-testid="location-address-title">
                          Headquarters
                        </h3>
                        <div className="text-muted-foreground space-y-1" data-testid="location-address">
                          <p>CineHub Pro</p>
                          <p>Movie Discovery Platform</p>
                          <p>Serving users globally</p>
                          <p>Available 24/7 online</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-6">
                      <h4 className="font-semibold mb-3" data-testid="location-hours-title">
                        Support Hours
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email Support:</span>
                          <span>24/7</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Live Chat:</span>
                          <span>24/7</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone Support:</span>
                          <span>Mon-Fri, 9AM-6PM EST</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-none" data-testid="location-global-card">
                  <CardContent className="pt-6 text-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <MapPin className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-4" data-testid="global-title">
                      Global Reach
                    </h3>
                    <p className="text-muted-foreground mb-6" data-testid="global-description">
                      CineHub Pro serves movie enthusiasts in over 50 countries worldwide. 
                      No matter where you are, we're here to help you discover amazing films.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary" data-testid="global-stat-countries">50+</div>
                        <div className="text-sm text-muted-foreground">Countries</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary" data-testid="global-stat-users">50K+</div>
                        <div className="text-sm text-muted-foreground">Active Users</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary" data-testid="global-stat-languages">10+</div>
                        <div className="text-sm text-muted-foreground">Languages</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
