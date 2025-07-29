import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Code, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Lightbulb,
  Rocket
} from "lucide-react";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

interface CommitData {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  ai_summary?: string;
}

interface NoCodeInsightsDashboardProps {
  commits: CommitData[];
  repositoryName: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
}

interface InsightMetric {
  id: string;
  title: string;
  value: string | number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  impact: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const NoCodeInsightsDashboard = ({ 
  commits, 
  repositoryName, 
  language, 
  stars, 
  forks, 
  openIssues 
}: NoCodeInsightsDashboardProps) => {
  
  const insights = useMemo(() => {
    // Analyze commit patterns for no-code relevant insights
    const totalCommits = commits.length;
    const recentCommits = commits.slice(0, 30);
    
    // Feature development analysis
    const featureCommits = commits.filter(c => 
      /\b(feature|add|new|implement|create|build)\b/i.test(c.message)
    ).length;
    
    // Bug fix analysis
    const bugFixCommits = commits.filter(c => 
      /\b(fix|bug|patch|error|resolve)\b/i.test(c.message)
    ).length;
    
    // UI/UX related commits
    const uiCommits = commits.filter(c => 
      /\b(ui|ux|design|style|layout|component|interface)\b/i.test(c.message)
    ).length;
    
    // Documentation commits
    const docCommits = commits.filter(c => 
      /\b(doc|readme|documentation|guide|tutorial)\b/i.test(c.message)
    ).length;

    // Calculate development velocity
    const velocity = totalCommits > 0 ? Math.round((featureCommits / totalCommits) * 100) : 0;
    
    // Calculate code quality score
    const qualityScore = totalCommits > 0 ? 
      Math.round(((totalCommits - bugFixCommits) / totalCommits) * 100) : 100;
    
    // Calculate user experience focus
    const uxFocus = totalCommits > 0 ? Math.round((uiCommits / totalCommits) * 100) : 0;
    
    // Calculate documentation health
    const docHealth = totalCommits > 0 ? Math.round((docCommits / totalCommits) * 100) : 0;

    const metrics: InsightMetric[] = [
      {
        id: 'velocity',
        title: 'Development Velocity',
        value: `${velocity}%`,
        description: 'Feature development vs maintenance ratio',
        trend: velocity > 60 ? 'up' : velocity > 30 ? 'stable' : 'down',
        impact: velocity > 60 ? 'positive' : velocity > 30 ? 'neutral' : 'negative',
        icon: <Rocket className="h-4 w-4" />,
        color: 'text-feature'
      },
      {
        id: 'quality',
        title: 'Code Quality',
        value: `${qualityScore}%`,
        description: 'Low bug-to-feature ratio indicates good practices',
        trend: qualityScore > 80 ? 'up' : qualityScore > 60 ? 'stable' : 'down',
        impact: qualityScore > 80 ? 'positive' : qualityScore > 60 ? 'neutral' : 'negative',
        icon: <Shield className="h-4 w-4" />,
        color: 'text-primary'
      },
      {
        id: 'ux-focus',
        title: 'UX Focus',
        value: `${uxFocus}%`,
        description: 'Commitment to user experience and design',
        trend: uxFocus > 20 ? 'up' : uxFocus > 10 ? 'stable' : 'down',
        impact: uxFocus > 20 ? 'positive' : uxFocus > 10 ? 'neutral' : 'negative',
        icon: <Users className="h-4 w-4" />,
        color: 'text-improvement'
      },
      {
        id: 'documentation',
        title: 'Documentation Health',
        value: `${docHealth}%`,
        description: 'Well-documented code is easier to maintain',
        trend: docHealth > 15 ? 'up' : docHealth > 5 ? 'stable' : 'down',
        impact: docHealth > 15 ? 'positive' : docHealth > 5 ? 'neutral' : 'negative',
        icon: <Code className="h-4 w-4" />,
        color: 'text-fix'
      }
    ];

    return { metrics, featureCommits, bugFixCommits, uiCommits, docCommits };
  }, [commits]);

  const commitDistribution = useMemo(() => {
    return [
      { 
        name: 'Features', 
        value: insights.featureCommits, 
        color: 'hsl(var(--feature))',
        percentage: commits.length > 0 ? Math.round((insights.featureCommits / commits.length) * 100) : 0
      },
      { 
        name: 'Bug Fixes', 
        value: insights.bugFixCommits, 
        color: 'hsl(var(--fix))',
        percentage: commits.length > 0 ? Math.round((insights.bugFixCommits / commits.length) * 100) : 0
      },
      { 
        name: 'UI/UX', 
        value: insights.uiCommits, 
        color: 'hsl(var(--improvement))',
        percentage: commits.length > 0 ? Math.round((insights.uiCommits / commits.length) * 100) : 0
      },
      { 
        name: 'Documentation', 
        value: insights.docCommits, 
        color: 'hsl(var(--primary))',
        percentage: commits.length > 0 ? Math.round((insights.docCommits / commits.length) * 100) : 0
      },
      { 
        name: 'Other', 
        value: commits.length - (insights.featureCommits + insights.bugFixCommits + insights.uiCommits + insights.docCommits), 
        color: 'hsl(var(--muted))',
        percentage: commits.length > 0 ? Math.round(((commits.length - (insights.featureCommits + insights.bugFixCommits + insights.uiCommits + insights.docCommits)) / commits.length) * 100) : 0
      }
    ];
  }, [commits, insights]);

  const projectHealth = useMemo(() => {
    const healthScore = insights.metrics.reduce((acc, metric) => {
      const value = typeof metric.value === 'string' ? 
        parseInt(metric.value.replace('%', '')) : metric.value;
      return acc + (typeof value === 'number' ? value : 0);
    }, 0) / insights.metrics.length;

    let status = 'excellent';
    let message = 'Project is in excellent shape for no-code development';
    let color = 'text-feature';

    if (healthScore < 40) {
      status = 'needs-attention';
      message = 'Project needs attention to improve development practices';
      color = 'text-fix';
    } else if (healthScore < 65) {
      status = 'good';
      message = 'Project shows good development practices with room for improvement';
      color = 'text-improvement';
    }

    return { score: Math.round(healthScore), status, message, color };
  }, [insights.metrics]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-feature" />;
      case 'down':
        return <AlertTriangle className="h-3 w-3 text-fix" />;
      default:
        return <CheckCircle className="h-3 w-3 text-improvement" />;
    }
  };

  const chartConfig = {
    features: { label: "Features", color: "hsl(var(--feature))" },
    bugFixes: { label: "Bug Fixes", color: "hsl(var(--fix))" },
    uiUx: { label: "UI/UX", color: "hsl(var(--improvement))" },
    documentation: { label: "Documentation", color: "hsl(var(--primary))" },
    other: { label: "Other", color: "hsl(var(--muted))" }
  };

  return (
    <div className="space-y-6">
      {/* Project Health Score */}
      <Card className="p-6 bg-gradient-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">No-Code Development Score</h3>
            <p className="text-sm text-muted-foreground">AI analysis of development practices</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${projectHealth.color}`}>
              {projectHealth.score}%
            </div>
            <Badge className={`${projectHealth.status === 'excellent' ? 'bg-feature text-feature-foreground' : 
              projectHealth.status === 'good' ? 'bg-improvement text-improvement-foreground' : 
              'bg-fix text-fix-foreground'}`}>
              {projectHealth.status}
            </Badge>
          </div>
        </div>
        <Progress value={projectHealth.score} className="mb-2" />
        <p className="text-sm text-muted-foreground">{projectHealth.message}</p>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.metrics.map((metric) => (
          <Card key={metric.id} className="p-4 hover:shadow-card transition-all duration-300 bg-gradient-card border">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${metric.impact === 'positive' ? 'bg-feature/10' : 
                metric.impact === 'negative' ? 'bg-fix/10' : 'bg-improvement/10'}`}>
                <span className={metric.color}>{metric.icon}</span>
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="space-y-1">
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <h4 className="font-medium text-sm text-foreground">{metric.title}</h4>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Commit Distribution Chart */}
      <Card className="p-6 bg-gradient-card border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Development Focus Areas</h3>
            <p className="text-sm text-muted-foreground">Distribution of development effort</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commitDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {commitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Distribution Details */}
          <div className="space-y-4">
            {commitDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card className="p-6 bg-gradient-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground">Suggestions to improve no-code readiness</p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.metrics.map((metric) => {
            const value = typeof metric.value === 'string' ? 
              parseInt(metric.value.replace('%', '')) : metric.value;
            
            if (typeof value === 'number' && value < 50) {
              return (
                <div key={metric.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-fix mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Improve {metric.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metric.id === 'velocity' && 'Focus more on feature development to attract no-code users'}
                        {metric.id === 'quality' && 'Reduce bugs by implementing better testing practices'}
                        {metric.id === 'ux-focus' && 'Invest more in user experience and interface design'}
                        {metric.id === 'documentation' && 'Add more documentation to help no-code developers'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })}
          
          {insights.metrics.every(m => {
            const val = typeof m.value === 'string' ? parseInt(m.value.replace('%', '')) : m.value;
            return typeof val === 'number' && val >= 50;
          }) && (
            <div className="p-3 bg-feature/10 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-feature mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Excellent Progress!</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your project shows great practices for no-code development. Keep up the good work!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default NoCodeInsightsDashboard;