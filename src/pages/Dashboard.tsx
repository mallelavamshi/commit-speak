import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { RepositoryCard } from "@/components/dashboard/RepositoryCard";
import SearchBar from "@/components/search/SearchBar";
import { Plus, TrendingUp, GitBranch, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
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

interface RepositoryAnalysis {
  overview: string;
  activity_level: 'high' | 'medium' | 'low';
  lifecycle_stage: string;
  quality_score: number;
  collaboration_health: string;
  key_insights: string[];
  recommendations: string[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, RepositoryAnalysis>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // CRITICAL SECURITY: Clear all state when user changes
    setRepositories([]);
    setAnalysis({});
    
    fetchRepositories();
  }, [user?.id, navigate]); // Use user.id specifically to detect user changes

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      
      // Fetch repositories
      const { data: repoData, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (repoError) {
        console.error('Error fetching repositories:', repoError);
        return;
      }

      setRepositories((repoData || []) as Repository[]);

      // Fetch analysis for completed repositories
      if (repoData && repoData.length > 0) {
        const completedRepos = repoData.filter(repo => repo.analysis_status === 'completed');
        
        for (const repo of completedRepos) {
          const { data: analysisData, error: analysisError } = await supabase
            .from('repository_analysis')
            .select('*')
            .eq('repository_id', repo.id)
            .eq('analysis_type', 'overview')
            .single();

          if (!analysisError && analysisData) {
            setAnalysis(prev => ({
              ...prev,
              [repo.id]: analysisData.content as unknown as RepositoryAnalysis
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchRepositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implementation would filter/search repositories
  };

  if (!user) {
    return null;
  }

  // Calculate stats from real data
  const stats = [
    { 
      label: "Connected Repositories", 
      value: repositories.length.toString(), 
      icon: GitBranch 
    },
    { 
      label: "Analyzed Projects", 
      value: repositories.filter(r => r.analysis_status === 'completed').length.toString(), 
      icon: Activity 
    },
    { 
      label: "Total Stars", 
      value: repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0).toString(), 
      icon: TrendingUp 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Repository Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your connected repositories and track development progress with AI insights
            </p>
          </div>
          <Button asChild>
            <Link to="/connect">
              <Plus className="h-4 w-4" />
              Connect Repository
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        {repositories.length > 0 && (
          <div className="mb-8 flex justify-center">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search across all repositories... (e.g., 'show me authentication changes')"
            />
          </div>
        )}

        {/* Stats Overview */}
        {repositories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Repositories Grid */}
        {loading ? (
          <div className="text-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Loading Your Repositories</h3>
            <p className="text-muted-foreground">
              Fetching your connected repositories and analysis data...
            </p>
          </div>
        ) : repositories.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6">Your Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repositories.map((repository) => (
                <RepositoryCard 
                  key={repository.id} 
                  repository={repository}
                  analysis={analysis[repository.id]}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State for New Users */
          <div className="text-center py-16">
            <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Repositories Connected</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your first GitHub repository to start getting AI-powered insights into your development lifecycle
            </p>
            <Button asChild>
              <Link to="/connect">
                <Plus className="h-4 w-4" />
                Connect Your First Repository
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;