import { Button } from "@/components/ui/button";
import { Github, Menu, GitBranch } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <GitBranch className="h-6 w-6 text-primary" />
          CommitTranslator
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`text-sm hover:text-primary transition-colors ${location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/connect" 
            className={`text-sm hover:text-primary transition-colors ${location.pathname === '/connect' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Connect
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="github" size="sm">
            <Github className="h-4 w-4" />
            Sign in with GitHub
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;