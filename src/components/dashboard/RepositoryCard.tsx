import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  GitBranch, 
  Star, 
  GitFork, 
  Clock, 
  ExternalLink, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2
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

interface RepositoryAnalysis {
  overview: string;
  activity_level: 'high' | 'medium' | 'low';
  lifecycle_stage: string;
  quality_score: number;
  collaboration_health: string;
  key_insights: string[];
  recommendations: string[];
}

interface RepositoryCardProps {
  repository: Repository;
  analysis?: RepositoryAnalysis;
}

export const RepositoryCard = ({ repository, analysis }: RepositoryCardProps) => {
  const getStatusIcon = () => {
    switch (repository.analysis_status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'analyzing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (repository.analysis_status) {
      case 'completed':
        return 'Analysis Complete';
      case 'analyzing':
        return 'Analyzing...';
      case 'failed':
        return 'Analysis Failed';
      default:
        return 'Pending Analysis';
    }
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">{repository.name}</h3>
              <p className="text-sm text-muted-foreground">{repository.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {repository.private && (
              <Badge variant="secondary">Private</Badge>
            )}
            {repository.language && (
              <Badge variant="outline">{repository.language}</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {repository.description && (
          <p className="text-sm text-muted-foreground">{repository.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
            {repository.open_issues_count} issues
          </div>
        </div>

        {/* Analysis Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* Analysis Results */}
        {analysis && repository.analysis_status === 'completed' && (
          <div className="space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs font-medium">Activity Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-2 w-16 rounded-full ${getActivityColor(analysis.activity_level)}`}
                  />
                  <span className="text-xs capitalize">{analysis.activity_level}</span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium mb-1">Quality Score</div>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.quality_score * 10} className="h-2 w-16" />
                  <span className="text-xs">{analysis.quality_score}/10</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium mb-1">Lifecycle Stage</div>
              <Badge variant="outline" className="text-xs">
                {analysis.lifecycle_stage}
              </Badge>
            </div>

            <div>
              <div className="text-xs font-medium mb-1">Overview</div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {analysis.overview}
              </p>
            </div>

            {analysis.key_insights.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Key Insights</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {analysis.key_insights.slice(0, 2).map((insight, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span className="line-clamp-1">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button asChild size="sm">
            <Link to={`/project/${repository.id}`}>
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
};