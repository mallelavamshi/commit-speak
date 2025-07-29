import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import CommitCard from "@/components/commits/CommitCard";
import SearchBar from "@/components/search/SearchBar";
import { ArrowLeft, Github, Star, GitBranch, Calendar, Filter } from "lucide-react";
import { Link, useParams } from "react-router-dom";

// Mock data for project timeline
const projectData = {
  id: "1",
  name: "E-commerce Platform",
  description: "Next.js online store with Stripe payments and admin dashboard",
  language: "TypeScript",
  stars: 156,
  lastUpdate: "2 hours ago",
  health: "excellent" as const
};

const commits = [
  {
    id: "a1b2c3d4e5f6",
    message: "Enhanced User Login Security",
    description: "Added automatic login renewal and improved security for user sessions. Users will stay logged in longer and their accounts are more secure.",
    type: "improvement" as const,
    timestamp: "2 hours ago",
    author: "Sarah Chen",
    files: ["auth.ts", "login.tsx", "middleware.ts"],
    url: "https://github.com/example/repo/commit/a1b2c3d4e5f6"
  },
  {
    id: "b2c3d4e5f6a1",
    message: "New Product Wishlist Feature",
    description: "Users can now save products to their wishlist for later purchase. Added heart icon to product cards and dedicated wishlist page.",
    type: "feature" as const,
    timestamp: "5 hours ago", 
    author: "Mike Rodriguez",
    files: ["wishlist.tsx", "product-card.tsx", "api/wishlist.ts"],
    url: "https://github.com/example/repo/commit/b2c3d4e5f6a1"
  },
  {
    id: "c3d4e5f6a1b2",
    message: "Fixed Shopping Cart Bug",
    description: "Resolved issue where items would disappear from cart after page refresh. Cart items now persist properly across browser sessions.",
    type: "fix" as const,
    timestamp: "1 day ago",
    author: "Alex Thompson", 
    files: ["cart.ts", "localStorage.ts"],
    url: "https://github.com/example/repo/commit/c3d4e5f6a1b2"
  },
  {
    id: "d4e5f6a1b2c3",
    message: "Improved Page Loading Speed",
    description: "Optimized image loading and added lazy loading for product images. Pages now load 40% faster on mobile devices.",
    type: "improvement" as const,
    timestamp: "2 days ago",
    author: "Sarah Chen",
    files: ["image-optimizer.ts", "product-list.tsx", "next.config.js"]
  },
  {
    id: "e5f6a1b2c3d4",
    message: "New Admin Analytics Dashboard",
    description: "Added comprehensive analytics dashboard for store owners. View sales data, popular products, and customer insights in real-time.",
    type: "feature" as const,
    timestamp: "3 days ago",
    author: "Mike Rodriguez", 
    files: ["analytics.tsx", "charts.tsx", "api/analytics.ts", "dashboard.tsx"]
  }
];

const ProjectTimeline = () => {
  const { id } = useParams();
  
  const handleSearch = (query: string) => {
    console.log("Searching commits for:", query);
    // Implementation would filter commits
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Project Header */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{projectData.name}</h1>
                <p className="text-muted-foreground mb-3">{projectData.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-4 w-4" />
                    {projectData.language}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {projectData.stars} stars
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Updated {projectData.lastUpdate}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="feature" className="whitespace-nowrap">
                Running smoothly
              </Badge>
              <Button variant="outline" size="sm">
                <Github className="h-4 w-4" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search this project... (e.g., 'show me all cart changes')"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              All Types
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold">Project Timeline</h2>
            <Badge variant="outline">{commits.length} changes</Badge>
          </div>
          
          {commits.map((commit) => (
            <CommitCard key={commit.id} {...commit} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline">
            Load More Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;