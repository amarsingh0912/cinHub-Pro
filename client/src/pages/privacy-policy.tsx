import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Lock, UserCheck, Database, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "September 23, 2025";

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        "Account Information: When you create an account, we collect your name, email address, and authentication information provided through Replit Auth.",
        "Usage Data: We collect information about how you use CineHub Pro, including movies you view, rate, and add to your watchlists.",
        "Device Information: We may collect information about your device, including IP address, browser type, and operating system.",
        "Cookies: We use cookies and similar technologies to enhance your experience and remember your preferences."
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Provide Services: To operate CineHub Pro, manage your account, and provide personalized movie recommendations.",
        "Improve Platform: To analyze usage patterns and improve our features and user experience.",
        "Communication: To send you important updates about our service and respond to your inquiries.",
        "Security: To protect our platform and users from fraud, abuse, and security threats."
      ]
    },
    {
      icon: UserCheck,
      title: "Information Sharing",
      content: [
        "Public Content: Movie reviews and public watchlists you create may be visible to other users.",
        "Service Providers: We may share information with trusted service providers who help us operate CineHub Pro.",
        "Legal Requirements: We may disclose information when required by law or to protect our rights and users.",
        "We never sell your personal information to third parties for marketing purposes."
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        "Encryption: All data transmission is encrypted using industry-standard SSL/TLS protocols.",
        "Secure Storage: Your data is stored on secure servers with appropriate access controls.",
        "Authentication: We use Replit's secure authentication system to protect your account.",
        "Regular Audits: We regularly review our security practices and update them as needed."
      ]
    },
    {
      icon: Shield,
      title: "Your Rights and Choices",
      content: [
        "Access: You can access and review your personal information through your account settings.",
        "Correction: You can update or correct your information at any time.",
        "Deletion: You can request deletion of your account and associated data by contacting us.",
        "Data Portability: You can request a copy of your data in a portable format."
      ]
    },
    {
      icon: Globe,
      title: "International Users",
      content: [
        "Global Service: CineHub Pro is available to users worldwide and data may be processed internationally.",
        "Data Transfers: We ensure appropriate safeguards are in place for international data transfers.",
        "Local Laws: We comply with applicable privacy laws in jurisdictions where we operate.",
        "EU Users: For users in the European Union, we comply with GDPR requirements."
      ]
    }
  ];

  const principles = [
    "We collect only the information necessary to provide and improve our services",
    "We use your data to enhance your movie discovery experience",
    "We implement strong security measures to protect your information",
    "We give you control over your personal information and privacy settings",
    "We are transparent about our data practices and policies"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="privacy-policy-page">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10" data-testid="privacy-hero">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-6" data-testid="privacy-title">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4" data-testid="privacy-description">
              Your privacy is important to us. This policy explains how CineHub Pro collects, uses, and protects your information.
            </p>
            <Badge variant="outline" className="text-sm px-4 py-2" data-testid="privacy-last-updated">
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </section>

        {/* Privacy Principles */}
        <section className="py-16" data-testid="privacy-principles">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4" data-testid="principles-title">
                Our Privacy Principles
              </h2>
              <p className="text-xl text-muted-foreground" data-testid="principles-description">
                These principles guide how we handle your personal information
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {principles.map((principle, index) => (
                <Card key={index} className="border-l-4 border-l-primary" data-testid={`principle-${index}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-muted-foreground" data-testid={`principle-text-${index}`}>
                        {principle}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Sections */}
        <section className="py-16 bg-card/30" data-testid="privacy-sections">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <Card key={index} data-testid={`privacy-section-${index}`}>
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

        {/* Contact and Updates */}
        <section className="py-16" data-testid="privacy-contact">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card data-testid="privacy-contact-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Questions About Privacy?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong> privacy@cinehubpro.com
                    </div>
                    <div>
                      <strong>Response Time:</strong> Within 48 hours
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="privacy-updates-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Policy Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We may update this Privacy Policy from time to time. When we do:
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• We'll notify you of significant changes</div>
                    <div>• The "Last Updated" date will be revised</div>
                    <div>• Continued use constitutes acceptance</div>
                    <div>• You can review changes anytime here</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-none" data-testid="privacy-commitment-card">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3" data-testid="commitment-title">
                  Our Commitment to Your Privacy
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto" data-testid="commitment-description">
                  At CineHub Pro, protecting your privacy isn't just a policy—it's a fundamental part of who we are. 
                  We're committed to earning and maintaining your trust through transparent, responsible data practices.
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