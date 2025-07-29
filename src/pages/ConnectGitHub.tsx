import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import { Github, GitBranch, CheckCircle, Clock, AlertCircle, ExternalLink, Lock, Unlock, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  language: string | null;
  description: string | null;
  html_url: string;
  updated_at: string;
}

const ConnectGitHub = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionType, setConnectionType] = useState<'token' | 'url' | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchRepositoriesWithToken = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const repos: GitHubRepo[] = await response.json();
      setRepositories(repos);
      setConnectionType('token');
      
      toast({
        title: "Success!",
        description: `Found ${repos.length} repositories`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch repositories. Please check your access token.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicRepository = async (url: string) => {
    try {
      setLoading(true);
      
      // Extract owner and repo from GitHub URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repoName] = match;
      const cleanRepoName = repoName.replace(/\.git$/, '');

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found or is private');
        }
        throw new Error('Failed to fetch repository');
      }

      const repo: GitHubRepo = await response.json();
      setRepositories([repo]);
      setConnectionType('url');
      
      toast({
        title: "Success!",
        description: `Connected to ${repo.full_name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to repository",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWithToken = () => {
    if (accessToken.trim()) {
      fetchRepositoriesWithToken(accessToken.trim());
    }
  };

  const handleConnectWithUrl = () => {
    if (repoUrl.trim()) {
      fetchPublicRepository(repoUrl.trim());
    }
  };

  const resetConnection = () => {
    setRepositories([]);
    setConnectionType(null);
    setAccessToken("");
    setRepoUrl("");
  };

  if (!user) {
    return null;
  }

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

        {repositories.length === 0 ? (
          <div className="space-y-8">
            {/* Info about Private vs Public Repos */}
            <Card className="p-6 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-2">Repository Access Information</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="flex items-center gap-2">
                      <Unlock className="h-4 w-4" />
                      <strong>Public repositories:</strong> Use the repository URL below - no token needed
                    </p>
                    <p className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <strong>Private repositories:</strong> Use a Personal Access Token to access your private repos
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Access Token Section */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Connect with Personal Access Token</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  For private repositories and full access to your GitHub account. 
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Create a token here →
                  </a>
                </p>
                
                <div className="space-y-3">
                  <Label htmlFor="access-token">GitHub Personal Access Token</Label>
                  <div className="relative">
                    <Input
                      id="access-token"
                      type={showToken ? "text" : "password"}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleConnectWithToken}
                    disabled={!accessToken.trim() || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Fetching repositories...
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4" />
                        Connect with Token
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Public Repository URL Section */}
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-sm text-muted-foreground">Or connect a public repository</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Unlock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Connect Public Repository</h2>
                  </div>
                  
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
                    onClick={handleConnectWithUrl}
                    disabled={!repoUrl.trim() || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-4 w-4" />
                        Connect Public Repository
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Connected State - Show Repositories */
          <div className="space-y-6">
            <Card className="p-6 border-feature bg-feature/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-feature" />
                  <div>
                    <h2 className="text-xl font-semibold">Successfully Connected!</h2>
                    <p className="text-sm text-muted-foreground">
                      {connectionType === 'token' 
                        ? `Found ${repositories.length} repositories from your GitHub account`
                        : `Connected to ${repositories[0]?.full_name}`
                      }
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={resetConnection}>
                  Connect Different Repository
                </Button>
              </div>
            </Card>

            {/* Repository List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {connectionType === 'token' ? 'Select Repositories to Monitor' : 'Repository Details'}
              </h3>
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <Card key={repo.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          {repo.private ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{repo.full_name}</h4>
                            <Badge variant={repo.private ? "secondary" : "default"}>
                              {repo.private ? "Private" : "Public"}
                            </Badge>
                            {repo.language && (
                              <Badge variant="outline">{repo.language}</Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground">{repo.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Updated: {new Date(repo.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                        <Button size="sm" asChild>
                          <Link to="/dashboard">
                            Start Monitoring
                          </Link>
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