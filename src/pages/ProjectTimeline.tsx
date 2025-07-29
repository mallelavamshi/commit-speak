import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import SocialCommitCard from "@/components/commits/SocialCommitCard";
import ProjectHealth from "@/components/dashboard/ProjectHealth";
import SearchBar from "@/components/search/SearchBar";
import { ArrowLeft, Github, Star, GitBranch, Calendar, Filter, Activity, MessageSquare, RefreshCw } from "lucide-react";
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
  plain_english: string;
  business_impact: string;
  type: 'feature' | 'improvement' | 'fix';
}

interface ProjectHealthData {
  status: 'healthy' | 'warning' | 'needs_attention';
  summary: string;
  recent_activity: string;
}

const ProjectTimeline = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [filteredCommits, setFilteredCommits] = useState<CommitData[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (id) {
      fetchRepositoryData();
    }
  }, [user, navigate, id]);

  // Set up real-time listeners for this specific repository
  useEffect(() => {
    if (!user || !id) return;

    console.log('Setting up real-time listeners for repository:', id);

    // Listen for repository changes
    const repositoriesChannel = supabase
      .channel('repository-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repositories',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Repository change detected:', payload);
          if (payload.eventType === 'UPDATE') {
            setRepository(payload.new as Repository);
          }
        }
      )
      .subscribe();

    // Listen for analysis changes for this repository
    const analysisChannel = supabase
      .channel('analysis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repository_analysis',
          filter: `repository_id=eq.${id}`
        },
        (payload) => {
          console.log('Analysis change detected for repository:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const analysisData = payload.new;
            
            if (analysisData.analysis_type === 'commits' && analysisData.content.recent_commits) {
              const commitsData_new = analysisData.content.recent_commits || [];
              setCommits(commitsData_new);
              setFilteredCommits(commitsData_new);
              
              if (analysisData.content.project_health) {
                setProjectHealth(analysisData.content.project_health);
              }
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(repositoriesChannel);
      supabase.removeChannel(analysisChannel);
    };
  }, [user, id]);

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

      console.log('Commits data fetch result:', { commitsData, commitsError });

      if (!commitsError && commitsData) {
        const commitContent = commitsData.content as any;
        console.log('Commit content structure:', commitContent);
        const commitsData_new = commitContent.recent_commits || [];
        console.log('Extracted commits:', commitsData_new);
        setCommits(commitsData_new);
        setFilteredCommits(commitsData_new);
        
        // Extract project health if available
        if (commitContent.project_health) {
          setProjectHealth(commitContent.project_health);
        }
      } else {
        console.error('Failed to fetch commits:', commitsError);
      }
    } catch (error) {
      console.error('Error in fetchRepositoryData:', error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Add manual sync functionality to test real-time updates
  const triggerManualSync = async () => {
    if (!repository) return;
    
    console.log('Triggering manual sync for repository:', repository.full_name);
    
    try {
      const githubToken = localStorage.getItem('github_token');
      if (!githubToken) {
        console.error('No GitHub token found');
        return;
      }

      const { data, error } = await supabase.functions.invoke('github-sync', {
        body: {
          repositoryId: repository.id,
          githubToken: githubToken
        }
      });

      if (error) {
        console.error('Manual sync error:', error);
      } else {
        console.log('Manual sync completed:', data);
      }
    } catch (error) {
      console.error('Error during manual sync:', error);
    }
  };

  // Implement AI-powered search
  const [aiResponse, setAiResponse] = useState<{
    answer: string;
    relevantCommits: CommitData[];
    repositoryName: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredCommits(commits);
      setAiResponse(null);
      return;
    }

    setIsAiLoading(true);
    
    try {
      // Call the AI chat function
      const response = await supabase.functions.invoke('repository-ai-chat', {
        body: { 
          query: query.trim(),
          repositoryId: id 
        }
      });

      if (response.error) {
        console.error('AI search error:', response.error);
        // Fallback to basic search
        const searchTerms = query.toLowerCase();
        const filtered = commits.filter(commit => 
          commit.plain_english.toLowerCase().includes(searchTerms) ||
          commit.business_impact.toLowerCase().includes(searchTerms) ||
          commit.message.toLowerCase().includes(searchTerms) ||
          commit.type.toLowerCase().includes(searchTerms)
        );
        setFilteredCommits(filtered);
      } else {
        // Use AI response
        setAiResponse(response.data);
        setFilteredCommits(response.data.relevantCommits || []);
      }
    } catch (error) {
      console.error('Error calling AI search:', error);
      // Fallback to basic search
      const searchTerms = query.toLowerCase();
      const filtered = commits.filter(commit => 
        commit.plain_english.toLowerCase().includes(searchTerms) ||
        commit.business_impact.toLowerCase().includes(searchTerms) ||
        commit.message.toLowerCase().includes(searchTerms) ||
        commit.type.toLowerCase().includes(searchTerms)
      );
      setFilteredCommits(filtered);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Update filtered commits when commits change
  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredCommits(commits);
      setAiResponse(null);
    }
  }, [commits]);

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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={triggerManualSync}
                title="Sync with GitHub"
              >
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Project Health Indicator */}
        {projectHealth && (
          <div className="mb-8">
            <ProjectHealth health={projectHealth} />
          </div>
        )}

        {/* Search and Filters */}
        {commits.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchBar 
                  onSearch={handleSearch}
                  placeholder="Ask me anything about this repository... (e.g., 'What is this app about?' or 'What should I work on next?')"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                  All Types
                </Button>
              </div>
            </div>
            
            {searchQuery && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>
                  Showing {filteredCommits.length} result{filteredCommits.length !== 1 ? 's' : ''} 
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI Response Section */}
        {aiResponse && (
          <div className="mb-8 bg-card border rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                <div className="text-muted-foreground prose prose-sm max-w-none">
                  {aiResponse.answer.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator for AI */}
        {isAiLoading && (
          <div className="mb-8 bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary animate-spin" />
              <span className="text-muted-foreground">AI is analyzing your query...</span>
            </div>
          </div>
        )}

        {/* Social Media Style Timeline */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-semibold">What's Been Happening</h2>
            <Badge variant="outline" className="text-xs">
              {filteredCommits.length} change{filteredCommits.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          {filteredCommits.length > 0 ? (
            <div className="space-y-4">
              {filteredCommits.map((commit) => (
                <SocialCommitCard key={commit.sha} commit={commit} />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground mb-6">
                Try searching for something else like "login", "bug fixes", or "new features"
              </p>
              <Button variant="outline" onClick={() => handleSearch("")}>
                Clear Search
              </Button>
            </div>
          ) : commits.length > 0 ? (
            <div className="text-center py-16">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Changes Match Your Filter</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter settings.
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Changes Yet</h3>
              <p className="text-muted-foreground mb-6">
                {repository.analysis_status === 'completed' 
                  ? 'No recent changes found for this project.'
                  : 'We\'re still analyzing this project. Check back in a few minutes!'
                }
              </p>
              {repository.analysis_status !== 'completed' && (
                <Button variant="outline" onClick={fetchRepositoryData}>
                  <Activity className="h-4 w-4" />
                  Check Analysis Progress
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