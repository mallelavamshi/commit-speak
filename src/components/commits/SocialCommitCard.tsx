import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Wrench, 
  Bug,
  Clock,
  User,
  ArrowRight
} from "lucide-react";

interface CommitCardProps {
  commit: {
    sha: string;
    message: string;
    author: string;
    date: string;
    plain_english: string;
    business_impact: string;
    type: 'feature' | 'improvement' | 'fix';
  };
}

const CommitCard = ({ commit }: CommitCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'feature':
        return {
          icon: Plus,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badge: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'improvement':
        return {
          icon: Wrench,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'fix':
        return {
          icon: Bug,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          badge: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      default:
        return {
          icon: Wrench,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getTypeConfig(commit.type);
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'New Feature';
      case 'improvement': return 'Improvement';
      case 'fix': return 'Bug Fix';
      default: return 'Update';
    }
  };

  return (
    <Card className={`p-6 hover:shadow-md transition-all duration-200 border-l-4 ${config.bgColor}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-white border-2 ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs font-medium ${config.badge}`}>
                {getTypeLabel(commit.type)}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(commit.date)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
              {commit.plain_english}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {commit.business_impact}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>by {commit.author}</span>
              <span>•</span>
              <span className="font-mono">{commit.sha.substring(0, 7)}</span>
            </div>
          </div>
        </div>

        {/* Expandable Technical Details */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted-foreground hover:text-foreground w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              {isExpanded ? 'Hide' : 'Show'} technical details
            </span>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          
          {isExpanded && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Original commit message:
              </p>
              <p className="text-xs font-mono text-foreground bg-background p-2 rounded border">
                {commit.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CommitCard;