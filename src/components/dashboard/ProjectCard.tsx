import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, GitBranch, Activity, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  lastUpdate: string;
  commitsThisWeek: number;
  health: "excellent" | "good" | "needs-attention";
  language: string;
  stars: number;
}

const healthConfig = {
  excellent: {
    color: "bg-feature text-feature-foreground",
    message: "Running smoothly"
  },
  good: {
    color: "bg-improvement text-improvement-foreground", 
    message: "Minor updates"
  },
  "needs-attention": {
    color: "bg-fix text-fix-foreground",
    message: "Needs attention"
  }
};

const ProjectCard = ({ 
  id, 
  name, 
  description, 
  lastUpdate, 
  commitsThisWeek, 
  health, 
  language, 
  stars 
}: ProjectCardProps) => {
  const healthInfo = healthConfig[health];

  return (
    <Card className="p-6 hover:shadow-card transition-all duration-300 bg-gradient-card border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Github className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge className={healthInfo.color}>
          {healthInfo.message}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{language}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{stars} stars</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{lastUpdate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 bg-primary rounded-full"></div>
          <span className="text-muted-foreground">{commitsThisWeek} commits this week</span>
        </div>
      </div>

      <Button asChild className="w-full">
        <Link to={`/project/${id}`}>
          View Timeline
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
};

export default ProjectCard;