import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  GitBranch, 
  Star, 
  GitFork, 
  ExternalLink, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
  Unlock
} from "lucide-react";
import { Link } from "react-router-dom";

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

interface RepositoryListItemProps {
  repository: Repository;
  onDelete?: (repositoryId: string) => void;
}

export const RepositoryListItem = ({ repository, onDelete }: RepositoryListItemProps) => {
  const getStatusIcon = () => {
    switch (repository.analysis_status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (repository.analysis_status) {
      case 'completed':
        return 'Complete';
      case 'analyzing':
        return 'Analyzing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Repository Icon and Privacy */}
        <div className="flex items-center gap-2">
          {repository.private ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Unlock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Repository Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{repository.full_name}</h3>
            <Badge variant={repository.private ? "secondary" : "outline"} className="text-xs">
              {repository.private ? "Private" : "Public"}
            </Badge>
            {repository.language && (
              <Badge variant="outline" className="text-xs">{repository.language}</Badge>
            )}
          </div>
          {repository.description && (
            <p className="text-xs text-muted-foreground truncate">{repository.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {repository.stargazers_count}
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {repository.forks_count}
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {repository.open_issues_count}
          </div>
        </div>

        {/* Analysis Status */}
        <div className="hidden sm:flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4">
        <Button asChild size="sm" variant="ghost">
          <Link to={`/project/${repository.id}`}>
            View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(repository.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};