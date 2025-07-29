import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import CommitCard from "@/components/commits/CommitCard";
import SearchBar from "@/components/search/SearchBar";
import { ArrowLeft, Github, Star, GitBranch, Calendar, Filter, Activity } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  last_analyzed_at: string | null;
}

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  translated_message: string;
}

const ProjectTimeline = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (id) {
      fetchRepositoryData();
    }
  }, [user, navigate, id]);

  const fetchRepositoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch repository details
      const { data: repoData, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (repoError) {
        console.error('Error fetching repository:', repoError);
        navigate("/dashboard");
        return;
      }

      setRepository(repoData as Repository);

      // Fetch commit analysis
      const { data: commitsData, error: commitsError } = await supabase
        .from('repository_analysis')
        .select('content')
        .eq('repository_id', id)
        .eq('analysis_type', 'commits')
        .single();

      if (!commitsError && commitsData) {
        const commitContent = commitsData.content as any;
        setCommits(commitContent.recent_commits || []);
      }
    } catch (error) {
      console.error('Error in fetchRepositoryData:', error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log("Searching commits for:", query);
    // Implementation would filter commits
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Loading Repository</h3>
            <p className="text-muted-foreground">
              Fetching repository data and commit analysis...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Github className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Repository Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The repository you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (repository.analysis_status) {
      case 'completed':
        return <Badge className="whitespace-nowrap bg-green-500/10 text-green-700 border-green-500/20">Analysis Complete</Badge>;
      case 'analyzing':
        return <Badge className="whitespace-nowrap bg-blue-500/10 text-blue-700 border-blue-500/20">Analyzing...</Badge>;
      case 'failed':
        return <Badge className="whitespace-nowrap bg-red-500/10 text-red-700 border-red-500/20">Analysis Failed</Badge>;
      default:
        return <Badge className="whitespace-nowrap bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending Analysis</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Project Header */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{repository.name}</h1>
                <p className="text-muted-foreground mb-3">{repository.description || 'No description available'}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {repository.language && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-4 w-4" />
                      {repository.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {repository.stargazers_count} stars
                  </span>
                  {repository.last_analyzed_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Analyzed {new Date(repository.last_analyzed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Button variant="outline" size="sm" asChild>
                <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        {commits.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <SearchBar 
                onSearch={handleSearch}
                placeholder="Search commits... (e.g., 'show me authentication changes')"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                All Types
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold">Commit Timeline</h2>
            <Badge variant="outline">{commits.length} recent commits</Badge>
          </div>
          
          {commits.length > 0 ? (
            commits.map((commit) => (
              <div key={commit.sha} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{commit.translated_message}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{commit.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>by {commit.author}</span>
                      <span>{new Date(commit.date).toLocaleDateString()}</span>
                      <span className="font-mono text-xs">{commit.sha.substring(0, 7)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Commit Data Available</h3>
              <p className="text-muted-foreground mb-6">
                {repository.analysis_status === 'completed' 
                  ? 'No recent commits found for this repository.'
                  : 'Commit analysis is still pending. Please check back later.'
                }
              </p>
              {repository.analysis_status !== 'completed' && (
                <Button variant="outline" onClick={fetchRepositoryData}>
                  Refresh Analysis
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;