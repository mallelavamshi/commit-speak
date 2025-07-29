import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/Header";
import { Github, GitBranch, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ConnectGitHub = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleConnect = async () => {
    setConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
    }, 2000);
  };

  if (!user) {
    return null;
  }

  const mockRepos = [
    { name: "my-ecommerce-app", owner: "username", private: false, language: "TypeScript" },
    { name: "mobile-api", owner: "username", private: true, language: "Python" },
    { name: "portfolio-site", owner: "username", private: false, language: "React" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Connect Your GitHub Repository</h1>
          <p className="text-lg text-muted-foreground">
            Start translating your technical commits into plain English
          </p>
        </div>

        {!connected ? (
          <div className="space-y-8">
            {/* GitHub OAuth */}
            <Card className="p-8 text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                <Github className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Sign in with GitHub</h2>
              <p className="text-muted-foreground mb-6">
                Connect your GitHub account to access your repositories and start translating commits
              </p>
              <Button 
                size="lg" 
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#24292e] hover:bg-[#24292e]/90 text-white"
              >
                {connecting ? (
                  <>
                    <Clock className="h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="h-5 w-5" />
                    Connect with GitHub
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                We only request read access to your repositories. No write permissions needed.
              </p>
            </Card>

            {/* Manual Repository URL */}
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-sm text-muted-foreground">Or enter repository URL manually</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <Button 
                    onClick={handleConnect}
                    disabled={!repoUrl || connecting}
                    className="w-full"
                  >
                    <GitBranch className="h-4 w-4" />
                    Connect Repository
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            <Card className="p-6 border-feature bg-feature/5">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-feature" />
                <h2 className="text-xl font-semibold">Successfully Connected!</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Your GitHub account is now connected. Select repositories to start translating commits.
              </p>
              <Button asChild>
                <Link to="/dashboard">
                  View Dashboard
                </Link>
              </Button>
            </Card>

            {/* Repository Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Repositories to Monitor</h3>
              <div className="space-y-3">
                {mockRepos.map((repo, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{repo.owner}/{repo.name}</h4>
                            {repo.private && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">Private</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{repo.language}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button size="sm">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Setup Instructions */}
            <Card className="p-6 bg-improvement/5 border-improvement">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-improvement mt-0.5" />
                <div>
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• We'll analyze your commit history and translate technical messages</li>
                    <li>• New commits will be automatically translated in real-time</li>
                    <li>• You can search your project history using natural language</li>
                    <li>• Team members will get clear, understandable project updates</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectGitHub;