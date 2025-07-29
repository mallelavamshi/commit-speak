import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import ProjectCard from "@/components/dashboard/ProjectCard";
import SearchBar from "@/components/search/SearchBar";
import { Plus, TrendingUp, GitBranch, Activity } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const projects = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "Next.js online store with payments",
    lastUpdate: "2 hours ago",
    commitsThisWeek: 12,
    health: "excellent" as const,
    language: "TypeScript",
    stars: 156
  },
  {
    id: "2", 
    name: "Mobile App Backend",
    description: "REST API for iOS/Android app",
    lastUpdate: "1 day ago",
    commitsThisWeek: 8,
    health: "good" as const,
    language: "Python",
    stars: 89
  },
  {
    id: "3",
    name: "Analytics Dashboard", 
    description: "Real-time data visualization",
    lastUpdate: "3 days ago",
    commitsThisWeek: 3,
    health: "needs-attention" as const,
    language: "React",
    stars: 234
  }
];

const stats = [
  { label: "Active Projects", value: "3", icon: GitBranch },
  { label: "Commits This Week", value: "23", icon: Activity },
  { label: "Team Members", value: "5", icon: TrendingUp },
];

const Dashboard = () => {
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Implementation would filter/search projects
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Project Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your connected repositories and track development progress
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
        <div className="mb-8 flex justify-center">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search across all projects... (e.g., 'show me all login changes')"
          />
        </div>

        {/* Stats Overview */}
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

        {/* Projects Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>

        {/* Empty State for New Users */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <GitBranch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Projects Connected</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your first GitHub repository to start translating commits into plain English
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