import { useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { contactFormSchema, type ContactFormData } from "@shared/schema";
import { Mail, MessageCircle, Phone, MapPin, Clock, Send, CheckCircle, Users, Globe, Zap } from "lucide-react";

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Contact form submission mutation
  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => {
      // For now, simulate API call - in a real app, this would send to backend
      return new Promise<{ success: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1500);
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
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
        <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 relative overflow-hidden" data-testid="contact-hero">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] opacity-20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full mb-8 animate-pulse">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent" data-testid="contact-title">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="contact-description">
              Have questions about CineHub Pro? Need help with your account? 
              We're here to help! Reach out to us through any of the methods below and we'll respond promptly.
            </p>
            <div className="flex flex-col items-center mt-8 space-y-4">
              <div className="flex justify-center space-x-4">
                <Badge variant="secondary" className="animate-bounce">
                  <Clock className="w-4 h-4 mr-2" />
                  24/7 Support
                </Badge>
                <Badge variant="outline" className="animate-bounce delay-100">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Response
                </Badge>
              </div>
              <Button 
                size="lg"
                className="group bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="hero-contact-cta"
              >
                <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                Start a Conversation
              </Button>
            </div>
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
                <Card data-testid="contact-form-card" id="contact-form">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Send us a Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="contact-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your full name"
                                    {...field}
                                    data-testid="input-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="your@email.com"
                                    {...field}
                                    data-testid="input-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="What's this about?"
                                  {...field}
                                  data-testid="input-subject"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us how we can help you..."
                                  rows={6}
                                  {...field}
                                  data-testid="textarea-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={contactMutation.isPending} 
                          className="w-full group hover:shadow-lg transition-all duration-300"
                          data-testid="button-submit"
                        >
                          {contactMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
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
                    <Button 
                      variant="outline" 
                      className="group hover:scale-105 transition-all duration-300" 
                      onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                      data-testid="button-more-help"
                    >
                      <Mail className="w-4 h-4 mr-2 group-hover:bounce" />
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
