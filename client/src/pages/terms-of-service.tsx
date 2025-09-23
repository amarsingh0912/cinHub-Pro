import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Shield, AlertTriangle, CheckCircle, Scale } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "September 23, 2025";
  const effectiveDate = "September 23, 2025";

  const sections = [
    {
      icon: CheckCircle,
      title: "Acceptance of Terms",
      content: [
        "By accessing or using CineHub Pro, you agree to be bound by these Terms of Service and our Privacy Policy.",
        "If you do not agree to these terms, please do not use our service.",
        "These terms apply to all users of CineHub Pro, including visitors, registered users, and contributors.",
        "You must be at least 13 years old to use CineHub Pro. Users under 18 should have parental consent."
      ]
    },
    {
      icon: Users,
      title: "User Accounts and Responsibilities",
      content: [
        "You are responsible for maintaining the security of your account and password.",
        "You must provide accurate and complete information when creating your account.",
        "You are responsible for all activities that occur under your account.",
        "You must not share your account credentials with others or allow unauthorized access.",
        "You must notify us immediately of any unauthorized use of your account."
      ]
    },
    {
      icon: Scale,
      title: "Acceptable Use Policy",
      content: [
        "You may not use CineHub Pro for any illegal or unauthorized purpose.",
        "You must not violate any laws in your jurisdiction while using our service.",
        "You may not post content that is hateful, threatening, or violates others' rights.",
        "You must not attempt to gain unauthorized access to our systems or other users' accounts.",
        "You may not use automated tools to access our service without permission."
      ]
    },
    {
      icon: FileText,
      title: "Content and Intellectual Property",
      content: [
        "Movie data is provided by The Movie Database (TMDB) and is subject to their terms.",
        "You retain ownership of content you create (reviews, watchlists, ratings).",
        "By posting content, you grant us a license to use, display, and distribute it on our platform.",
        "You must not post copyrighted content without proper authorization.",
        "We respect intellectual property rights and will respond to valid DMCA notices."
      ]
    },
    {
      icon: Shield,
      title: "Privacy and Data Protection",
      content: [
        "Our collection and use of your information is governed by our Privacy Policy.",
        "We implement appropriate security measures to protect your data.",
        "You can request access to, correction of, or deletion of your personal data.",
        "We may process your data to provide and improve our services.",
        "We do not sell your personal information to third parties."
      ]
    },
    {
      icon: AlertTriangle,
      title: "Disclaimers and Limitations",
      content: [
        "CineHub Pro is provided 'as is' without warranties of any kind.",
        "We do not guarantee the accuracy or completeness of movie information.",
        "We are not responsible for third-party content or external links.",
        "Our liability is limited to the maximum extent permitted by law.",
        "We reserve the right to modify or discontinue our service at any time."
      ]
    }
  ];

  const prohibitedActivities = [
    "Violating any applicable laws or regulations",
    "Impersonating other users or entities",
    "Posting spam, offensive, or inappropriate content",
    "Attempting to hack or compromise our systems",
    "Creating multiple accounts to circumvent restrictions",
    "Using our service for commercial purposes without authorization",
    "Sharing or distributing copyrighted content illegally",
    "Harassing, bullying, or threatening other users"
  ];

  const userRights = [
    "Access and use CineHub Pro in accordance with these terms",
    "Create and manage your personal movie watchlists and favorites",
    "Rate and review movies you've watched",
    "Participate in our community features",
    "Access your personal data and request corrections",
    "Delete your account and associated data",
    "Receive support for technical issues",
    "Be notified of significant changes to our terms"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="terms-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="terms-hero">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-6" data-testid="terms-title">
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4" data-testid="terms-description">
              These terms govern your use of CineHub Pro. Please read them carefully before using our service.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="text-sm px-4 py-2" data-testid="terms-last-updated">
                Last Updated: {lastUpdated}
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2" data-testid="terms-effective-date">
                Effective: {effectiveDate}
              </Badge>
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="py-16" data-testid="terms-overview">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800" data-testid="terms-overview-card">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-display font-bold mb-4 text-center" data-testid="overview-title">
                  Terms Overview
                </h2>
                <p className="text-muted-foreground text-center max-w-2xl mx-auto" data-testid="overview-description">
                  CineHub Pro is a free movie discovery platform that helps you find, organize, and share your favorite films. 
                  By using our service, you agree to follow these terms and be part of our respectful community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Rights and Responsibilities */}
        <section className="py-16 bg-card/30" data-testid="terms-rights">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card data-testid="user-rights-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Your Rights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userRights.map((right, index) => (
                      <div key={index} className="flex items-start gap-3" data-testid={`user-right-${index}`}>
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{right}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="prohibited-activities-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Prohibited Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prohibitedActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3" data-testid={`prohibited-activity-${index}`}>
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{activity}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Detailed Terms Sections */}
        <section className="py-16" data-testid="terms-sections">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <Card key={index} data-testid={`terms-section-${index}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <section.icon className="w-5 h-5 text-primary" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-3" data-testid={`section-${index}-item-${itemIndex}`}>
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                          <p className="text-muted-foreground">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Changes and Contact */}
        <section className="py-16 bg-card/30" data-testid="terms-changes">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card data-testid="terms-changes-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Changes to Terms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We may update these Terms of Service from time to time. When we do:
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• We'll post the updated terms on this page</div>
                    <div>• We'll update the "Last Updated" date</div>
                    <div>• For significant changes, we'll notify users</div>
                    <div>• Continued use means you accept the changes</div>
                    <div>• You can stop using our service if you disagree</div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="terms-contact-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Questions About Terms?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about these terms or need clarification:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong> legal@cinehubpro.com
                    </div>
                    <div>
                      <strong>Support:</strong> support@cinehubpro.com
                    </div>
                    <div>
                      <strong>Response Time:</strong> Within 48 hours
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-none" data-testid="terms-agreement-card">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3" data-testid="agreement-title">
                  Fair and Transparent Terms
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="agreement-description">
                  These terms are designed to be fair to both you and CineHub Pro. We believe in transparency and 
                  want you to understand exactly what you're agreeing to when you use our service.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}