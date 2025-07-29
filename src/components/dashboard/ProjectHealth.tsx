import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Activity,
  Clock
} from "lucide-react";

interface ProjectHealthProps {
  health: {
    status: 'healthy' | 'warning' | 'needs_attention';
    summary: string;
    recent_activity: string;
  };
}

const ProjectHealth = ({ health }: ProjectHealthProps) => {
  const getHealthConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          badge: 'bg-green-100 text-green-800 border-green-200',
          label: 'Running Smoothly'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'Needs Attention'
        };
      case 'needs_attention':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          badge: 'bg-red-100 text-red-800 border-red-200',
          label: 'Issues Detected'
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Unknown Status'
        };
    }
  };

  const config = getHealthConfig(health.status);
  const Icon = config.icon;

  return (
    <Card className={`p-6 border-l-4 ${config.bgColor}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full bg-white border-2 ${config.color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`font-medium ${config.badge}`}>
              {config.label}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {health.summary}
          </h3>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{health.recent_activity}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectHealth;