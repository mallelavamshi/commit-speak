import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { Github, GitBranch, Search, Zap, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-hero opacity-90"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              GitHub for Humans
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transform technical GitHub commits into plain English. 
              Perfect for no-code developers, project managers, and anyone who wants to 
              understand what's happening in their projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="hero" asChild>
                <Link to="/connect">
                  <Github className="h-5 w-5" />
                  Connect Your Repository
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/dashboard">
                  View Demo Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Make Development Transparent
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bridge the gap between technical teams and stakeholders with clear, 
            understandable project updates.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center bg-gradient-card border hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-feature/10 rounded-full w-fit mx-auto mb-4">
              <Search className="h-8 w-8 text-feature" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Natural Language Search</h3>
            <p className="text-muted-foreground">
              Ask questions like "when did we add login?" and get instant answers 
              from your project history.
            </p>
          </Card>

          <Card className="p-8 text-center bg-gradient-card border hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-improvement/10 rounded-full w-fit mx-auto mb-4">
              <Zap className="h-8 w-8 text-improvement" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Get instant notifications when changes happen, explained in simple terms 
              that everyone can understand.
            </p>
          </Card>

          <Card className="p-8 text-center bg-gradient-card border hover:shadow-card transition-all duration-300">
            <div className="p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Project Health</h3>
            <p className="text-muted-foreground">
              Monitor your project's health with clear indicators and 
              easy-to-understand status updates.
            </p>
          </Card>
        </div>

        {/* Sample Timeline */}
        <div className="bg-card/50 rounded-2xl p-8 border">
          <h3 className="text-2xl font-semibold mb-6 text-center">See Your Commits Like This</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-muted-foreground">Before: Technical Jargon</h4>
              <div className="bg-muted/20 rounded-lg p-4 font-mono text-sm">
                <div className="text-muted-foreground">feat(auth): implement JWT token validation with refresh token rotation and secure httpOnly cookies</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-feature">After: Plain English</h4>
              <div className="bg-feature/10 border border-feature/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-feature rounded-full">
                    <Users className="h-3 w-3 text-feature-foreground" />
                  </div>
                  <span className="font-medium">New Feature: Enhanced Login Security</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Added automatic login renewal and improved security for user sessions. 
                  Users will stay logged in longer and their accounts are more secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Make Your Code Human-Readable?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect your GitHub repository in seconds and start getting clear, 
            understandable updates about your project.
          </p>
          <Button size="xl" variant="hero" asChild>
            <Link to="/connect">
              <GitBranch className="h-5 w-5" />
              Get Started Free
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;