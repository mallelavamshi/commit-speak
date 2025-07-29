import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCommit, Plus, Wrench, Bug, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

interface CommitCardProps {
  id: string;
  message: string;
  description: string;
  type: "feature" | "improvement" | "fix";
  timestamp: string;
  author: string;
  files: string[];
  url?: string;
}

const typeConfig = {
  feature: {
    icon: Plus,
    variant: "feature" as const,
    label: "New Feature",
    bgClass: "bg-feature/10 border-feature/20"
  },
  improvement: {
    icon: Wrench,
    variant: "improvement" as const,
    label: "Improvement",
    bgClass: "bg-improvement/10 border-improvement/20"
  },
  fix: {
    icon: Bug,
    variant: "fix" as const,
    label: "Bug Fix",
    bgClass: "bg-fix/10 border-fix/20"
  }
};

const CommitCard = ({ id, message, description, type, timestamp, author, files, url }: CommitCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card className={`p-4 transition-all duration-300 hover:shadow-card ${config.bgClass} border`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-full bg-${type}`}>
            <Icon className={`h-4 w-4 text-${type}-foreground`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-foreground leading-tight">{message}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
              {url && (
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitCommit className="h-3 w-3" />
                {id.substring(0, 7)}
              </span>
              <span>{author}</span>
              <span>{timestamp}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="h-6 px-2 text-xs"
            >
              Details
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {expanded && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Files changed:</p>
                  <div className="flex flex-wrap gap-1">
                    {files.map((file, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {file}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CommitCard;