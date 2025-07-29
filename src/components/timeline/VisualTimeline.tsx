import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GitCommit, Star, GitBranch, Users, Clock, TrendingUp, Target } from "lucide-react";
import { format, parseISO, isAfter, subDays, subWeeks, subMonths } from "date-fns";

interface CommitData {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  ai_summary?: string;
  impact_score?: number;
}

interface VisualTimelineProps {
  commits: CommitData[];
  repositoryName: string;
  stars: number;
  language: string;
}

interface TimelineEvent {
  id: string;
  type: 'milestone' | 'release' | 'feature' | 'hotfix' | 'refactor';
  title: string;
  description: string;
  date: Date;
  commits: CommitData[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  color: string;
}

const VisualTimeline = ({ commits, repositoryName, stars, language }: VisualTimelineProps) => {
  const timelineEvents = useMemo(() => {
    if (!commits.length) return [];

    const events: TimelineEvent[] = [];
    const now = new Date();
    
    // Group commits by time periods and analyze patterns
    const weeklyGroups = new Map<string, CommitData[]>();
    const monthlyGroups = new Map<string, CommitData[]>();
    
    commits.forEach(commit => {
      const date = parseISO(commit.author.date);
      const weekKey = format(date, 'yyyy-ww');
      const monthKey = format(date, 'yyyy-MM');
      
      if (!weeklyGroups.has(weekKey)) weeklyGroups.set(weekKey, []);
      if (!monthlyGroups.has(monthKey)) monthlyGroups.set(monthKey, []);
      
      weeklyGroups.get(weekKey)!.push(commit);
      monthlyGroups.get(monthKey)!.push(commit);
    });

    // Generate milestone events based on commit patterns
    monthlyGroups.forEach((monthCommits, monthKey) => {
      if (monthCommits.length >= 5) {
        const firstCommit = monthCommits[monthCommits.length - 1];
        const date = parseISO(firstCommit.author.date);
        
        // Analyze commit messages for patterns
        const hasReleaseKeywords = monthCommits.some(c => 
          /\b(release|version|v\d|deploy|launch|publish)\b/i.test(c.message)
        );
        const hasFeatureKeywords = monthCommits.some(c => 
          /\b(feature|add|new|implement|create)\b/i.test(c.message)
        );
        const hasFixKeywords = monthCommits.some(c => 
          /\b(fix|bug|patch|hotfix|error)\b/i.test(c.message)
        );

        let eventType: TimelineEvent['type'] = 'milestone';
        let impact: TimelineEvent['impact'] = 'medium';
        let icon = <Target className="h-4 w-4" />;
        let color = 'bg-primary';

        if (hasReleaseKeywords) {
          eventType = 'release';
          impact = 'high';
          icon = <Star className="h-4 w-4" />;
          color = 'bg-feature';
        } else if (hasFeatureKeywords) {
          eventType = 'feature';
          impact = 'medium';
          icon = <GitBranch className="h-4 w-4" />;
          color = 'bg-improvement';
        } else if (hasFixKeywords) {
          eventType = 'hotfix';
          impact = 'low';
          icon = <GitCommit className="h-4 w-4" />;
          color = 'bg-fix';
        }

        events.push({
          id: `${eventType}-${monthKey}`,
          type: eventType,
          title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Sprint`,
          description: `${monthCommits.length} commits with focus on ${eventType}`,
          date,
          commits: monthCommits,
          impact,
          icon,
          color
        });
      }
    });

    // Add project milestones based on repository data
    if (isAfter(now, subMonths(now, 1))) {
      events.push({
        id: 'project-start',
        type: 'milestone',
        title: 'Project Genesis',
        description: `${repositoryName} project initiated with ${language}`,
        date: subMonths(now, 6),
        commits: [],
        impact: 'critical',
        icon: <Target className="h-4 w-4" />,
        color: 'bg-primary'
      });
    }

    if (stars > 10) {
      events.push({
        id: 'community-growth',
        type: 'milestone',
        title: 'Community Milestone',
        description: `Reached ${stars} stars - Growing developer interest`,
        date: subWeeks(now, 2),
        commits: [],
        impact: 'high',
        icon: <Users className="h-4 w-4" />,
        color: 'bg-feature'
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [commits, repositoryName, stars, language]);

  const getImpactBadge = (impact: TimelineEvent['impact']) => {
    const variants = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-improvement text-improvement-foreground',
      high: 'bg-feature text-feature-foreground',
      critical: 'bg-fix text-fix-foreground'
    };
    return variants[impact];
  };

  const getActivityMetrics = useMemo(() => {
    const recentCommits = commits.filter(c => 
      isAfter(parseISO(c.author.date), subDays(new Date(), 30))
    ).length;
    
    const totalCommits = commits.length;
    const averageCommitsPerWeek = Math.round(totalCommits / Math.max(1, 
      Math.ceil((new Date().getTime() - parseISO(commits[commits.length - 1]?.author.date || new Date().toISOString()).getTime()) / (7 * 24 * 60 * 60 * 1000))
    ));

    return {
      recentCommits,
      totalCommits,
      averageCommitsPerWeek
    };
  }, [commits]);

  return (
    <div className="space-y-6">
      {/* Project Health Overview */}
      <Card className="p-6 bg-gradient-card border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Project Roadmap Overview</h3>
            <p className="text-sm text-muted-foreground">Visual development timeline and milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{getActivityMetrics.recentCommits}</div>
            <div className="text-sm text-muted-foreground">Commits (30 days)</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-feature">{timelineEvents.length}</div>
            <div className="text-sm text-muted-foreground">Major Milestones</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-improvement">{getActivityMetrics.averageCommitsPerWeek}</div>
            <div className="text-sm text-muted-foreground">Avg Commits/Week</div>
          </div>
        </div>
      </Card>

      {/* Interactive Timeline */}
      <Card className="p-6 bg-gradient-card border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Development Timeline</h3>
            <p className="text-sm text-muted-foreground">Key milestones and development phases</p>
          </div>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-feature to-improvement"></div>

          {/* Timeline Events */}
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Timeline Node */}
                <div className={`relative z-10 p-3 rounded-full ${event.color} text-white shadow-card`}>
                  {event.icon}
                </div>

                {/* Event Content */}
                <div className="flex-1 pb-6">
                  <Card className="p-4 hover:shadow-card transition-all duration-300 bg-background/50 backdrop-blur-sm border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{event.title}</h4>
                          <Badge className={getImpactBadge(event.impact)}>
                            {event.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(event.date, 'MMM dd, yyyy')}
                          </div>
                          {event.commits.length > 0 && (
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              {event.commits.length} commits
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.commits.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Recent activity:</p>
                        <div className="text-xs text-muted-foreground">
                          {event.commits.slice(0, 3).map(commit => commit.message.split('\n')[0]).join(' • ')}
                          {event.commits.length > 3 && '...'}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            ))}

            {timelineEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 bg-muted/30 rounded-lg inline-block mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">Timeline in Progress</h4>
                <p className="text-sm text-muted-foreground">
                  As your project grows, we'll generate an intelligent timeline of milestones and releases.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm">
          <Star className="h-4 w-4 mr-2" />
          Export Timeline
        </Button>
        <Button variant="outline" size="sm">
          <Target className="h-4 w-4 mr-2" />
          Set Milestone
        </Button>
      </div>
    </div>
  );
};

export default VisualTimeline;