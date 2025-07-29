import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/layout/Header";
import { RepositoryCard } from "@/components/dashboard/RepositoryCard";
import { RepositoryListItem } from "@/components/dashboard/RepositoryListItem";
import { Input } from "@/components/ui/input";

import { Plus, TrendingUp, GitBranch, Activity, Grid3X3, List, Search, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [analysis, setAnalysis] = useState<Record<string, RepositoryAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [repositoryToDelete, setRepositoryToDelete] = useState<Repository | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'syncing' | 'synced' | 'error'>>({});
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

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

  // Set up real-time listeners
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time listeners for repositories and analysis');

    // Listen for repository changes
    const repositoriesChannel = supabase
      .channel('repositories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repositories',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Repository change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            setRepositories(prev => [payload.new as Repository, ...prev]);
            toast({
              title: "New Repository Added",
              description: `${payload.new.full_name} has been connected to your dashboard.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setRepositories(prev => 
              prev.map(repo => 
                repo.id === payload.new.id ? payload.new as Repository : repo
              )
            );
            // Show notification for significant changes
            if (payload.old.analysis_status !== payload.new.analysis_status) {
              const statusMessages = {
                analyzing: "Analysis started",
                completed: "Analysis completed",
                failed: "Analysis failed"
              };
              toast({
                title: "Repository Status Updated",
                description: `${payload.new.full_name}: ${statusMessages[payload.new.analysis_status] || 'Status changed'}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setRepositories(prev => prev.filter(repo => repo.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Listen for analysis changes
    const analysisChannel = supabase
      .channel('analysis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repository_analysis'
        },
        (payload) => {
          console.log('Analysis change detected:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new.analysis_type === 'overview') {
              setAnalysis(prev => ({
                ...prev,
                [payload.new.repository_id]: payload.new.content as RepositoryAnalysis
              }));
              
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "New Analysis Available",
                  description: "Repository analysis has been completed with fresh insights.",
                });
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
  }, [user?.id, toast]);

  // Auto-sync with GitHub every 2 minutes (reduced frequency)
  useEffect(() => {
    if (!user || repositories.length === 0) return;

    const syncWithGitHub = async () => {
      console.log('Auto-syncing repositories with GitHub...', repositories.length, 'repositories');
      
      const githubToken = localStorage.getItem('github_token');
      if (!githubToken) {
        console.log('No GitHub token found, skipping auto-sync');
        return;
      }

      for (const repo of repositories.slice(0, 3)) { // Limit to first 3 repos to avoid rate limits
        if (syncStatus[repo.id] === 'syncing') continue; // Skip if already syncing
        
        console.log('Syncing repository:', repo.full_name);
        setSyncStatus(prev => ({ ...prev, [repo.id]: 'syncing' }));
        
        try {
          const { data, error } = await supabase.functions.invoke('github-sync', {
            body: {
              repositoryId: repo.id,
              githubToken: githubToken
            }
          });

          if (error) {
            console.error('GitHub sync error for', repo.full_name, error);
            setSyncStatus(prev => ({ ...prev, [repo.id]: 'error' }));
          } else {
            console.log('GitHub sync success for', repo.full_name, data);
            setSyncStatus(prev => ({ ...prev, [repo.id]: 'synced' }));
          }
        } catch (error) {
          console.error('Error syncing repository', repo.full_name, error);
          setSyncStatus(prev => ({ ...prev, [repo.id]: 'error' }));
        }
        
        // Add small delay between repos to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setLastSyncTime(new Date());
    };

    // Initial sync after 5 seconds
    const initialSyncTimeout = setTimeout(() => {
      console.log('Starting initial sync...');
      syncWithGitHub();
    }, 5000);
    
    // Set up periodic sync every 2 minutes
    const syncInterval = setInterval(() => {
      console.log('Starting periodic sync...');
      syncWithGitHub();
    }, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialSyncTimeout);
      clearInterval(syncInterval);
    };
  }, [user?.id, repositories.length]); // Only depend on repository count, not full array

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

  // Update filtered repositories when repositories or search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRepositories(repositories);
    } else {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepositories(filtered);
    }
  }, [repositories, searchQuery]);

  const handleDeleteRepository = async (repositoryId: string) => {
    setDeleteLoading(repositoryId);
    
    try {
      // Delete repository analysis first (due to foreign key constraint)
      const { error: analysisError } = await supabase
        .from('repository_analysis')
        .delete()
        .eq('repository_id', repositoryId);

      if (analysisError) {
        console.error('Error deleting repository analysis:', analysisError);
        throw new Error('Failed to delete repository analysis');
      }

      // Delete the repository
      const { error: repoError } = await supabase
        .from('repositories')
        .delete()
        .eq('id', repositoryId)
        .eq('user_id', user!.id); // Ensure user can only delete their own repos

      if (repoError) {
        console.error('Error deleting repository:', repoError);
        throw new Error('Failed to delete repository');
      }

      // Update local state
      setRepositories(prev => prev.filter(repo => repo.id !== repositoryId));
      setAnalysis(prev => {
        const updated = { ...prev };
        delete updated[repositoryId];
        return updated;
      });

      toast({
        title: "Repository Removed",
        description: `Successfully removed repository from your dashboard.`,
      });

    } catch (error) {
      console.error('Error in handleDeleteRepository:', error);
      toast({
        title: "Error",
        description: "Failed to remove repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
      setRepositoryToDelete(null);
    }
  };

  const initiateDelete = (repositoryId: string) => {
    const repository = repositories.find(repo => repo.id === repositoryId);
    if (repository) {
      setRepositoryToDelete(repository);
    }
  };

  const manualSync = async () => {
    if (repositories.length === 0) return;
    
    toast({
      title: "Syncing Repositories",
      description: "Checking for updates from GitHub...",
    });

    for (const repo of repositories) {
      setSyncStatus(prev => ({ ...prev, [repo.id]: 'syncing' }));
      
      try {
        const githubToken = localStorage.getItem('github_token');
        if (!githubToken) {
          setSyncStatus(prev => ({ ...prev, [repo.id]: 'error' }));
          continue;
        }

        const { error } = await supabase.functions.invoke('github-sync', {
          body: {
            repositoryId: repo.id,
            githubToken: githubToken
          }
        });

        if (error) {
          setSyncStatus(prev => ({ ...prev, [repo.id]: 'error' }));
        } else {
          setSyncStatus(prev => ({ ...prev, [repo.id]: 'synced' }));
        }
      } catch (error) {
        setSyncStatus(prev => ({ ...prev, [repo.id]: 'error' }));
      }
    }
    
    setLastSyncTime(new Date());
    toast({
      title: "Sync Complete",
      description: "Repositories have been synced with GitHub.",
    });
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
            {/* Header with Search, Sync Status and View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">Your Repositories</h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Sync Status */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Live Sync</span>
                  </div>
                  <span>•</span>
                  <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={manualSync}
                    className="h-8 px-2"
                    disabled={Object.values(syncStatus).some(status => status === 'syncing')}
                  >
                    <RefreshCw className={`h-3 w-3 ${Object.values(syncStatus).some(status => status === 'syncing') ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Repository List/Grid */}
            {filteredRepositories.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-2">
                  {filteredRepositories.map((repository) => (
                    <RepositoryListItem 
                      key={repository.id} 
                      repository={repository}
                      onDelete={initiateDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRepositories.map((repository) => (
                    <RepositoryCard 
                      key={repository.id} 
                      repository={repository}
                      analysis={analysis[repository.id]}
                      onDelete={initiateDelete}
                    />
                  ))}
                </div>
              )
            ) : searchQuery ? (
              /* No Search Results */
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground mb-6">
                  No repositories match your search for "{searchQuery}". Try a different search term.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            ) : null}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!repositoryToDelete} onOpenChange={() => setRepositoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Repository</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{repositoryToDelete?.full_name}</strong> from your dashboard? 
                This will permanently delete all analysis data and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => repositoryToDelete && handleDeleteRepository(repositoryToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
                disabled={!!deleteLoading}
              >
                {deleteLoading ? "Removing..." : "Remove Repository"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Dashboard;